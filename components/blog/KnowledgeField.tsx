"use client";

import { useEffect, useRef } from "react";

/**
 * A small neural network in the outline of a brain. Nodes sit inside the shape,
 * hairlines join close neighbours, and signals travel along them: each one lights
 * the node it reaches and often passes on to a neighbour, the way an idea spreads.
 * The pointer wakes the nodes it passes. Colours come from the page palette at paint
 * time. It only runs while on screen, and under reduced motion it draws one still frame.
 */

// A side view of a brain in a 400 x 300 box, facing right: cerebrum, cerebellum and stem.
const BRAIN =
  "M300 205 C335 205 372 180 370 135 C372 90 330 45 275 45 C250 18 190 15 160 42 C110 32 62 68 66 112 " +
  "C40 135 48 180 85 190 C80 215 110 238 145 235 C175 250 215 240 220 220 L232 262 C234 275 252 276 254 264 " +
  "L258 222 C275 228 292 218 300 205 Z";
// Two fissures drawn faintly inside it, so the outline reads as a brain.
const FISSURES = "M215 34 C205 80 218 110 206 142 M128 168 C180 150 235 165 290 176";
const BOX = { w: 400, h: 300 };

const MIN_GAP = 14;
const LINK = 31;
const MAX_LINKS = 3;
const REACH = 90;
const MAX_PULSES = 90;

/** Mulberry32, so the server-rendered page and every visit draw the same brain. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Net = { xs: number[]; ys: number[]; links: number[][]; edges: [number, number][] };

function build(): Net {
  const path = new Path2D(BRAIN);
  const ctx = document.createElement("canvas").getContext("2d")!;
  const rand = rng(7);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < 12000; i++) {
    const x = rand() * BOX.w, y = rand() * BOX.h;
    if (!ctx.isPointInPath(path, x, y)) continue;
    if (xs.some((px, j) => Math.hypot(px - x, ys[j] - y) < MIN_GAP)) continue;
    xs.push(x); ys.push(y);
  }
  const links: number[][] = xs.map(() => []);
  const edges: [number, number][] = [];
  xs.forEach((x, i) => {
    const near = xs
      .map((px, j) => ({ j, d: Math.hypot(px - x, ys[j] - ys[i]) }))
      .filter((n) => n.j !== i && n.d < LINK)
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_LINKS);
    for (const n of near) {
      if (links[i].includes(n.j)) continue;
      links[i].push(n.j); links[n.j].push(i);
      edges.push([i, n.j]);
    }
  });
  return { xs, ys, links, edges };
}

type Pulse = { a: number; b: number; t: number; depth: number };

export function KnowledgeField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const host = cv?.parentElement;
    if (!cv || !host) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const net = build();
    const outline = new Path2D(BRAIN), fissures = new Path2D(FISSURES);
    const n = net.xs.length;
    const act = new Float32Array(n);
    const pulses: Pulse[] = [];
    const rand = Math.random;
    let w = 0, h = 0, scale = 1, ox = 0, oy = 0;
    const pointer = { x: -999, y: -999, on: false, last: 0 };
    let raf = 0, prev = 0, ambient = 0, visible = true;

    const sx = (x: number) => ox + x * scale;
    const sy = (y: number) => oy + y * scale;

    const setup = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      if (!w || !h) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(w / BOX.w, h / BOX.h) * 0.96;
      ox = (w - BOX.w * scale) / 2; oy = (h - BOX.h * scale) / 2;
      return true;
    };

    const send = (a: number, b: number, depth: number) => {
      if (pulses.length < MAX_PULSES) pulses.push({ a, b, t: 0, depth });
    };

    const step = (dt: number) => {
      // Now and then a node fires on its own.
      ambient -= dt;
      if (ambient <= 0) {
        ambient = 0.35 + rand() * 0.7;
        const i = Math.floor(rand() * n);
        act[i] = 1;
        for (const j of net.links[i]) if (rand() < 0.7) send(i, j, 0);
      }
      for (let i = 0; i < n; i++) act[i] = Math.max(0, act[i] - dt * 0.9);
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k];
        p.t += dt * 1.6;
        if (p.t < 1) continue;
        pulses.splice(k, 1);
        act[p.b] = 1;
        // The signal often carries on, and fades out after a few hops.
        if (p.depth < 4) {
          for (const j of net.links[p.b]) if (j !== p.a && rand() < 0.62 - p.depth * 0.1) send(p.b, j, p.depth + 1);
        }
      }
      if (pointer.on) {
        for (let i = 0; i < n; i++) {
          const d = Math.hypot(sx(net.xs[i]) - pointer.x, sy(net.ys[i]) - pointer.y);
          if (d < REACH) act[i] = Math.max(act[i], 1 - d / REACH);
        }
      }
    };

    const paint = (animated: boolean) => {
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const ink = getComputedStyle(cv).getPropertyValue("--ink").trim() || "#fff";
      ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 1;
      // The outline and fissures, faint and still.
      ctx.save();
      ctx.translate(ox, oy); ctx.scale(scale, scale);
      ctx.lineWidth = 1.2 / scale; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.globalAlpha = 0.22; ctx.stroke(outline);
      ctx.globalAlpha = 0.12; ctx.stroke(fissures);
      ctx.restore();
      ctx.lineWidth = 1; ctx.lineCap = "butt";
      for (const [a, b] of net.edges) {
        ctx.globalAlpha = animated ? 0.1 + Math.max(act[a], act[b]) * 0.32 : 0.16;
        ctx.beginPath();
        ctx.moveTo(sx(net.xs[a]), sy(net.ys[a]));
        ctx.lineTo(sx(net.xs[b]), sy(net.ys[b]));
        ctx.stroke();
      }
      for (let i = 0; i < n; i++) {
        const a = animated ? act[i] : 0;
        ctx.globalAlpha = 0.34 + a * 0.66;
        ctx.beginPath();
        ctx.arc(sx(net.xs[i]), sy(net.ys[i]), 1.4 + a * 1.9, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (animated) {
        // A signal in flight: a short bright streak.
        ctx.lineCap = "round";
        for (const p of pulses) {
          const x0 = sx(net.xs[p.a]), y0 = sy(net.ys[p.a]), x1 = sx(net.xs[p.b]), y1 = sy(net.ys[p.b]);
          const head = p.t, tail = Math.max(0, p.t - 0.28);
          ctx.globalAlpha = 0.95 * (1 - p.depth * 0.12);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x0 + (x1 - x0) * tail, y0 + (y1 - y0) * tail);
          ctx.lineTo(x0 + (x1 - x0) * head, y0 + (y1 - y0) * head);
          ctx.stroke();
        }
        ctx.lineCap = "butt";
      }
      ctx.globalAlpha = 1;
    };

    if (!setup()) return;
    paint(false);

    const ro = new ResizeObserver(() => { if (setup()) paint(false); });
    ro.observe(cv);
    const mo = new MutationObserver(() => { if (reduced || !visible) paint(false); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    if (reduced) return () => { ro.disconnect(); mo.disconnect(); };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(cv);

    const local = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      pointer.x = p.x; pointer.y = p.y; pointer.on = true;
      // Moving over the brain sets off a signal now and then.
      const now = performance.now();
      if (now - pointer.last > 160) {
        pointer.last = now;
        let best = -1, bd = REACH;
        for (let i = 0; i < n; i++) {
          const d = Math.hypot(sx(net.xs[i]) - p.x, sy(net.ys[i]) - p.y);
          if (d < bd) { bd = d; best = i; }
        }
        if (best >= 0) for (const j of net.links[best]) send(best, j, 1);
      }
    };
    const onLeave = () => { pointer.on = false; };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    const tick = (now: number) => {
      const dt = prev ? Math.min((now - prev) / 1000, 1 / 30) : 0;
      prev = now;
      if (visible) { step(dt); paint(true); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); mo.disconnect(); io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="blog-hero__art" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
