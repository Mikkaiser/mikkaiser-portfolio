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

/**
 * A post's particle field. As the cover, it flows all the time it is on screen
 * and the pointer pushes particles aside; they spring back into the path. As a
 * thumbnail it holds still until its index row is hovered. A click inside the
 * cover's shape scatters everything, and it gathers back 3s later. Under reduced
 * motion both draw a single still frame. The loop's colour comes from the page
 * palette, read at paint time, like the diagrams; the stars behind it take a
 * faint tint per theme and only twinkle, untouched by the pointer and the burst.
 */
export function ParticleCover({ shape, kind }: { shape: CoverShape; kind: "cover" | "thumb" }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const host = kind === "cover" ? cv?.parentElement : cv?.closest<HTMLElement>(".entry");
    if (!cv || !host) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let f: Field | null = null;
    let w = 0, h = 0;
    let us = new Float32Array(0), px = new Float32Array(0), py = new Float32Array(0), vx = new Float32Array(0), vy = new Float32Array(0);
    let gathered = false;

    const setup = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      if (!w || !h) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      f = field(shape, kind, w, h);
      const n = f.seeds.length;
      us = Float32Array.from(f.seeds, (s) => s.u);
      px = new Float32Array(n); py = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
      // On first paint the cover's particles start scattered and gather into the path.
      const scatter = kind === "cover" && !reduced && !gathered;
      for (let i = 0; i < n; i++) {
        const p = target(i);
        px[i] = scatter ? Math.random() * w : p.x;
        py[i] = scatter ? Math.random() * h : p.y;
      }
      gathered = true;
      return true;
    };

    const target = (i: number) => f!.at(us[i], f!.seeds[i].off);

    const pointer = { x: 0, y: 0, vx: 0, vy: 0, on: false, until: 0 };

    const paint = (head: number, t: number) => {
      const ctx = cv.getContext("2d");
      if (!ctx || !f) return;
      ctx.clearRect(0, 0, w, h);
      const ink = getComputedStyle(cv).getPropertyValue("--ink").trim();
      // A light ink means the dark theme, where the stars take their pale tints.
      const dark = parseInt(ink.slice(1, 3), 16) > 128;
      for (const st of f.stars) {
        const a = twinkle(st, t);
        const x = st.x * w, y = st.y * h;
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
      for (let i = 0; i < px.length; i++) {
        const s = f.seeds[i];
        let a = s.tone + glow(us[i], head) * 0.6;
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
      for (let i = 0; i < px.length; i++) {
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
      const spring = free ? 0 : SPRING * back * back * (3 - 2 * back);
      const damp = free ? FREE_DAMP : DAMP;
      for (let i = 0; i < px.length; i++) {
        us[i] = (us[i] + f.seeds[i].speed * dt) % 1;
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
        if (free) {
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

    // The thumbnail only flows while its row is hovered; the cover whenever it is on screen.
    let hovered = kind === "cover";
    const onEnter = () => { hovered = true; };
    const onLeave = () => { hovered = kind === "cover"; pointer.on = false; host.style.cursor = ""; };
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
    }

    let raf = 0, prev = 0, n = 0, visible = false, ready = setup();
    const tick = (now: number) => {
      if (n++ % 6 === 0) {
        const r = cv.getBoundingClientRect();
        visible = r.bottom > 0 && r.top < window.innerHeight;
      }
      const dt = prev ? Math.min((now - prev) / 1000, 1 / 30) : 0;
      prev = now;
      if (visible && ready && hovered) {
        step(dt);
        paint((now % PULSE_MS) / PULSE_MS, now);
      }
      raf = requestAnimationFrame(tick);
    };
    if (ready) paint(STILL_HEAD, 0);
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => { ready = setup(); if (ready) paint(STILL_HEAD, 0); });
    ro.observe(cv);
    // A thumbnail at rest still follows a theme switch.
    const mo = new MutationObserver(() => { if (!hovered) paint(STILL_HEAD, 0); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("click", onClick);
      host.style.cursor = "";
    };
  }, [shape, kind]);

  return <canvas ref={ref} className={kind === "cover" ? "cover__canvas" : "entry__canvas"} aria-hidden="true" />;
}
