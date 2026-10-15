"use client";

import { useEffect, useRef } from "react";
import { field, glow, PULSE_MS, STAR_TINTS, STILL_HEAD, twinkle, type CoverShape, type Field } from "./field";

const SPRING = 22;
const DAMP = 6.5;
const REACH = 120;
const PUSH = 3200;
const DRAG = 0.9;
// A click inside the loop blows the field apart: particles fly free for
// BURST_MS, then the spring eases back in over RETURN_MS and pulls them home.
const BURST_MS = 3000;
const RETURN_MS = 700;
const FREE_DAMP = 1.1;
// On a card the particles rest as a loose cloud this wide (of the card's short
// side) and gather into the loop while it is hovered; the stars shift with the
// pointer by up to PARALLAX px, the bigger ones more, so the sky has depth.
const CLOUD = 0.06;
const PARALLAX = 10;
// How fast a card eases back to rest after the pointer leaves, per second: about 3.5s to settle.
const OUT_RATE = 1.1;
const AT_REST = 0.01;

/**
 * A post's particle field. As the cover, it flows all the time it is on screen
 * and the pointer pushes particles aside; they spring back into the path. A
 * click inside the cover's shape scatters everything, and it gathers back 3s
 * later. On an index card the particles rest as a loose cloud round the loop and
 * gather into it while the card is hovered (always, on a touch screen), with the
 * stars drifting against the pointer. Under reduced motion both draw a single
 * still frame of the gathered loop. The loop's colour comes from the page
 * palette, read at paint time, like the diagrams; the stars behind it take a
 * faint tint per theme and twinkle. The pointer pushes stars aside like the
 * loop, but a burst leaves them where they are.
 */
export function ParticleCover({ shape, kind }: { shape: CoverShape; kind: "cover" | "card" }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const host = kind === "cover" ? cv?.parentElement : cv?.closest<HTMLElement>(".postcard");
    if (!cv || !host) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = matchMedia("(hover: none)").matches;
    // How gathered the loop is: 1 is the path, 0 the card's resting cloud.
    let g = kind === "cover" || reduced || touch ? 1 : 0;
    // How fast the loop flows and glows: 1 while it is hovered, easing to 0 after the pointer leaves,
    // so it slows to a stop instead of freezing.
    let flow = kind === "cover" || reduced || touch ? 1 : 0;
    // The star parallax: where it is, and where the pointer wants it.
    const par = { x: 0, y: 0, gx: 0, gy: 0 };

    let f: Field | null = null;
    let w = 0, h = 0;
    let us = new Float32Array(0), px = new Float32Array(0), py = new Float32Array(0), vx = new Float32Array(0), vy = new Float32Array(0);
    let rest = new Float32Array(0);
    let gathered = false;

    const setup = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      if (!w || !h) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      f = field(shape, kind, w, h);
      // Path particles first, then the stars.
      const S = f.seeds.length, n = S + f.stars.length;
      us = Float32Array.from(f.seeds, (s) => s.u);
      // Each particle's spot in the resting cloud, as an offset from its place on the path.
      const spread = Math.min(w, h) * CLOUD;
      const gauss = () => Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random());
      rest = Float32Array.from({ length: 2 * S }, () => gauss() * spread);
      px = new Float32Array(n); py = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
      // On first paint the cover's particles start scattered and gather into the path; the stars are already there.
      const scatter = kind === "cover" && !reduced && !gathered;
      for (let i = 0; i < n; i++) {
        const p = target(i);
        px[i] = scatter && i < S ? Math.random() * w : p.x;
        py[i] = scatter && i < S ? Math.random() * h : p.y;
      }
      gathered = true;
      return true;
    };

    const target = (i: number) => {
      const S = f!.seeds.length;
      if (i < S) {
        const p = f!.at(us[i], f!.seeds[i].off);
        if (g < 1) { p.x += (1 - g) * rest[2 * i]; p.y += (1 - g) * rest[2 * i + 1]; }
        return p;
      }
      const st = f!.stars[i - S];
      const depth = (st.size / 2.7) * PARALLAX;
      return { x: st.x * w + par.x * depth, y: st.y * h + par.y * depth };
    };

    const pointer = { x: 0, y: 0, vx: 0, vy: 0, on: false, until: 0 };

    // On a shape made of several strokes, each stroke carries its own pulse, started at a different
    // point, so signals fire all over the drawing at once instead of one sweep going round.
    const lit = (i: number, head: number) => {
      const sd = f!.seeds[i];
      if (sd.lo === undefined || sd.hi === undefined) return glow(us[i], head);
      return glow((us[i] - sd.lo) / (sd.hi - sd.lo), (head + sd.lo * 7.31) % 1);
    };

    const paint = (head: number, t: number, mix = 1) => {
      const ctx = cv.getContext("2d");
      if (!ctx || !f) return;
      ctx.clearRect(0, 0, w, h);
      const ink = getComputedStyle(cv).getPropertyValue("--ink").trim();
      // A light ink means the dark theme, where the stars take their pale tints.
      const dark = parseInt(ink.slice(1, 3), 16) > 128;
      const S = f.seeds.length;
      for (let j = 0; j < f.stars.length; j++) {
        const st = f.stars[j], x = px[S + j], y = py[S + j];
        const rest = twinkle(st, 0);
        let a = rest + (twinkle(st, t) - rest) * mix;
        // Stars near the pointer light up a little, less than the loop does.
        if (pointer.on) {
          const d = Math.hypot(x - pointer.x, y - pointer.y);
          if (d < REACH) a += (1 - d / REACH) * 0.3;
        }
        a = Math.min(1, a);
        ctx.fillStyle = dark ? STAR_TINTS[st.tint].dark : STAR_TINTS[st.tint].light;
        if (st.halo) {
          ctx.globalAlpha = a * 0.14;
          ctx.beginPath();
          ctx.arc(x, y, st.size * 1.8, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(x, y, st.size / 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = ink;
      for (let i = 0; i < S; i++) {
        const s = f.seeds[i];
        let a = s.tone + (lit(i, head) * mix + lit(i, STILL_HEAD) * (1 - mix)) * 0.6;
        let r = s.size;
        if (pointer.on) {
          const d = Math.hypot(px[i] - pointer.x, py[i] - pointer.y);
          if (d < REACH) { a += (1 - d / REACH) * 0.5; r *= 1 + (1 - d / REACH) * 0.4; }
        }
        ctx.globalAlpha = Math.min(1, a);
        ctx.beginPath();
        ctx.arc(px[i], py[i], r / 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let burstAt = 0;
    const explode = (at: { x: number; y: number }) => {
      burstAt = performance.now();
      // Only the loop blows apart; the stars stay in the sky.
      for (let i = 0; i < f!.seeds.length; i++) {
        const dx = px[i] - at.x, dy = py[i] - at.y;
        const d = Math.hypot(dx, dy);
        const a = (d > 0.5 ? Math.atan2(dy, dx) : Math.random() * 2 * Math.PI) + (Math.random() - 0.5) * 0.5;
        // Closer particles fly faster; everything moves.
        const v = (260 + Math.random() * 620) * (0.6 + 0.4 * Math.exp(-d / 400));
        vx[i] = Math.cos(a) * v;
        vy[i] = Math.sin(a) * v;
      }
    };

    const step = (dt: number) => {
      if (!f) return;
      const now = performance.now();
      if (pointer.until && now > pointer.until) { pointer.on = false; pointer.until = 0; }
      const since = burstAt ? now - burstAt : Infinity;
      const free = since < BURST_MS;
      const back = Math.min(1, Math.max(0, (since - BURST_MS) / RETURN_MS));
      if (kind === "card") {
        // In is quick, out is slow: the loop drifts apart over a couple of seconds.
        const k = Math.min(1, dt * (hovered ? 3 : OUT_RATE));
        g += ((hovered ? 1 : 0) - g) * (touch ? 1 : k);
        flow += ((hovered ? 1 : 0) - flow) * (touch ? 1 : Math.min(1, dt * (hovered ? 4 : OUT_RATE)));
        par.x += (par.gx - par.x) * k; par.y += (par.gy - par.y) * k;
      }
      const loopSpring = free ? 0 : SPRING * back * back * (3 - 2 * back);
      const loopDamp = free ? FREE_DAMP : DAMP;
      const S = f.seeds.length;
      for (let i = 0; i < px.length; i++) {
        const star = i >= S;
        if (!star) {
          // A particle wraps within its own stroke (the whole path unless the shape has several).
          const sd = f.seeds[i], lo = sd.lo ?? 0, hi = sd.hi ?? 1;
          us[i] = lo + ((us[i] + sd.speed * dt * (kind === "card" ? flow : 1) - lo) % (hi - lo));
        }
        // Stars always spring home, even while the loop is scattered.
        const spring = star ? SPRING : loopSpring, damp = star ? DAMP : loopDamp;
        const t = target(i);
        let ax = (t.x - px[i]) * spring - vx[i] * damp;
        let ay = (t.y - py[i]) * spring - vy[i] * damp;
        if (pointer.on) {
          const dx = px[i] - pointer.x, dy = py[i] - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < REACH && d > 0.01) {
            const k = (1 - d / REACH) ** 2;
            // Pushed away from the pointer, and dragged a little the way it moves.
            ax += (dx / d) * PUSH * k + pointer.vx * DRAG * k;
            ay += (dy / d) * PUSH * k + pointer.vy * DRAG * k;
          }
        }
        vx[i] += ax * dt; vy[i] += ay * dt;
        px[i] += vx[i] * dt; py[i] += vy[i] * dt;
        // While scattered, the cover's edges bounce particles back, so the burst fills it.
        if (free && !star) {
          if (px[i] < 0 || px[i] > w) { px[i] = px[i] < 0 ? 0 : w; vx[i] *= -0.6; }
          if (py[i] < 0 || py[i] > h) { py[i] = py[i] < 0 ? 0 : h; vy[i] *= -0.6; }
        }
      }
    };

    if (reduced) {
      const once = () => { if (setup()) paint(STILL_HEAD, 0); };
      once();
      const mo = new MutationObserver(() => paint(STILL_HEAD, 0));
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
      const ro = new ResizeObserver(once);
      ro.observe(cv);
      return () => { mo.disconnect(); ro.disconnect(); };
    }

    // A card only moves while it is hovered, and while it settles after; the cover whenever it is on screen.
    let hovered = kind === "cover" || touch;
    const onEnter = () => { hovered = true; };
    const onLeave = () => {
      hovered = kind === "cover" || touch; pointer.on = false; host.style.cursor = "";
      par.gx = 0; par.gy = 0;
    };
    const local = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    let last = 0;
    const onMove = (e: PointerEvent) => {
      const p = local(e), now = performance.now();
      const gap = Math.max(16, now - last) / 1000;
      if (pointer.on) { pointer.vx = (p.x - pointer.x) / gap; pointer.vy = (p.y - pointer.y) / gap; }
      pointer.x = p.x; pointer.y = p.y; pointer.on = true; pointer.until = 0; last = now;
      // The middle of the loop is clickable, so it says so.
      host.style.cursor = f?.inside(p) ? "pointer" : "";
    };
    // The stars drift against the pointer: right of centre, they slide left.
    const onCardMove = (e: PointerEvent) => {
      const p = local(e);
      par.gx = -(p.x / w - 0.5) * 2; par.gy = -(p.y / h - 0.5) * 2;
    };
    // A tap on a phone pushes the particles once, then lets them settle; inside the loop the click handles it.
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      if (e.pointerType === "mouse" || f?.inside(p)) return;
      Object.assign(pointer, p, { vx: 0, vy: 0, on: true, until: performance.now() + 450 });
    };
    const onClick = (e: MouseEvent) => {
      const p = local(e);
      if (f?.inside(p)) explode(p);
    };
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointerleave", onLeave);
    if (kind === "cover") {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerdown", onDown);
      host.addEventListener("click", onClick);
    } else if (!touch) {
      host.addEventListener("pointermove", onCardMove);
    }

    let raf = 0, prev = 0, n = 0, visible = false, running = hovered, ready = setup();
    const tick = (now: number) => {
      if (n++ % 6 === 0) {
        const r = cv.getBoundingClientRect();
        visible = r.bottom > 0 && r.top < window.innerHeight;
      }
      const dt = prev ? Math.min((now - prev) / 1000, 1 / 30) : 0;
      prev = now;
      // A card keeps going until it has eased all the way back to rest.
      const settling = kind === "card" && (flow > AT_REST || g > AT_REST);
      const wasRunning = running;
      running = hovered || settling;
      if (visible && ready && running) {
        step(dt);
        paint((now % PULSE_MS) / PULSE_MS, now, kind === "card" ? flow : 1);
      } else if (kind === "card" && wasRunning && !running && ready) {
        flow = 0; g = 0;
        paint(STILL_HEAD, 0);
      }
      raf = requestAnimationFrame(tick);
    };
    if (ready) paint(STILL_HEAD, 0);
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => { ready = setup(); if (ready) paint(STILL_HEAD, 0); });
    ro.observe(cv);
    // A card at rest still follows a theme switch.
    const mo = new MutationObserver(() => { if (!running) paint(STILL_HEAD, 0); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointermove", onCardMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("click", onClick);
      host.style.cursor = "";
    };
  }, [shape, kind]);

  return <canvas ref={ref} className={kind === "cover" ? "cover__canvas" : "postcard__canvas"} aria-hidden="true" />;
}
