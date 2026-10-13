"use client";

import { useEffect, useRef } from "react";
import { drift, field, glow, PULSE_MS, STILL_HEAD, type CoverShape, type Field } from "./field";

const SPRING = 22;
const DAMP = 6.5;
const REACH = 120;
const PUSH = 3200;
const DRAG = 0.9;

/**
 * A post's particle field. As the cover, it flows all the time it is on screen
 * and the pointer pushes particles aside; they spring back into the path. As a
 * thumbnail it holds still until its index row is hovered. Under reduced
 * motion both draw a single still frame. Colours come from the page palette,
 * read at paint time, like the diagrams.
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
      // Path particles first, then the dust.
      const n = f.seeds.length + f.motes.length;
      us = Float32Array.from(f.seeds, (s) => s.u);
      px = new Float32Array(n); py = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
      // On first paint the cover's particles start scattered and gather into the path.
      const scatter = kind === "cover" && !reduced && !gathered;
      for (let i = 0; i < n; i++) {
        const p = target(i, 0);
        px[i] = scatter ? Math.random() * w : p.x;
        py[i] = scatter ? Math.random() * h : p.y;
      }
      gathered = true;
      return true;
    };

    const target = (i: number, t: number) => {
      const S = f!.seeds.length;
      return i < S ? f!.at(us[i], f!.seeds[i].off) : drift(f!.motes[i - S], w, h, t);
    };

    const pointer = { x: 0, y: 0, vx: 0, vy: 0, on: false, until: 0 };

    const paint = (head: number) => {
      const ctx = cv.getContext("2d");
      if (!ctx || !f) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = getComputedStyle(cv).getPropertyValue("--ink").trim();
      const S = f.seeds.length;
      for (let i = 0; i < px.length; i++) {
        const s = i < S ? f.seeds[i] : f.motes[i - S];
        let a = i < S ? s.tone + glow(us[i], head) * 0.6 : s.tone;
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

    const step = (dt: number) => {
      if (!f) return;
      const now = performance.now();
      if (pointer.until && now > pointer.until) { pointer.on = false; pointer.until = 0; }
      const S = f.seeds.length;
      for (let i = 0; i < px.length; i++) {
        if (i < S) us[i] = (us[i] + f.seeds[i].speed * dt) % 1;
        const t = target(i, now);
        let ax = (t.x - px[i]) * SPRING - vx[i] * DAMP;
        let ay = (t.y - py[i]) * SPRING - vy[i] * DAMP;
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
      }
    };

    if (reduced) {
      const once = () => { if (setup()) paint(STILL_HEAD); };
      once();
      const mo = new MutationObserver(() => paint(STILL_HEAD));
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
      const ro = new ResizeObserver(once);
      ro.observe(cv);
      return () => { mo.disconnect(); ro.disconnect(); };
    }

    // The thumbnail only flows while its row is hovered; the cover whenever it is on screen.
    let hovered = kind === "cover";
    const onEnter = () => { hovered = true; };
    const onLeave = () => { hovered = kind === "cover"; pointer.on = false; };
    const local = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    let last = 0;
    const onMove = (e: PointerEvent) => {
      const p = local(e), now = performance.now();
      const gap = Math.max(16, now - last) / 1000;
      if (pointer.on) { pointer.vx = (p.x - pointer.x) / gap; pointer.vy = (p.y - pointer.y) / gap; }
      pointer.x = p.x; pointer.y = p.y; pointer.on = true; pointer.until = 0; last = now;
    };
    // A tap on a phone pushes the particles once, then lets them settle.
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      Object.assign(pointer, local(e), { vx: 0, vy: 0, on: true, until: performance.now() + 450 });
    };
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointerleave", onLeave);
    if (kind === "cover") {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerdown", onDown);
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
        paint((now % PULSE_MS) / PULSE_MS);
      }
      raf = requestAnimationFrame(tick);
    };
    if (ready) paint(STILL_HEAD);
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => { ready = setup(); if (ready) paint(STILL_HEAD); });
    ro.observe(cv);
    // A thumbnail at rest still follows a theme switch.
    const mo = new MutationObserver(() => { if (!hovered) paint(STILL_HEAD); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
    };
  }, [shape, kind]);

  return <canvas ref={ref} className={kind === "cover" ? "cover__canvas" : "entry__canvas"} aria-hidden="true" />;
}
