"use client";

import { useEffect, type RefObject } from "react";

/*
 * Shared plumbing for the canvas diagrams in posts. Acta's diagram rules: one
 * canvas, the page palette (no colour except the signal for failure), labels in
 * JetBrains Mono at 10px or more, drawn only while on screen, and a single
 * still frame under reduced motion.
 */

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** Progress of t through [a, b], eased, 0 before and 1 after. */
export const seg = (t: number, a: number, b: number) => {
  const u = clamp((t - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};
export const within = (t: number, a: number, b: number) => t >= a && t < b;

export type Pt = { x: number; y: number };
export const lerp = (a: Pt, b: Pt, u: number): Pt => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
export const quad = (a: Pt, c: Pt, b: Pt, u: number): Pt => ({
  x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
  y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
});

export type BoxState = "idle" | "active" | "lit";

/** Drawing helpers bound to one frame: the page colours and the mono family are read at paint time. */
export function pen(ctx: CanvasRenderingContext2D, cv: HTMLCanvasElement) {
  const cs = getComputedStyle(cv);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  const C = { ink: v("--ink"), soft: v("--ink-soft"), muted: v("--muted"), faint: v("--faint"), rule: v("--rule"), raised: v("--raised"), bg: v("--bg") };
  const family = cs.fontFamily;
  // The canvas's own font-size is the blog's fluid micro size, so labels grow with the text on wide screens.
  const scale = (parseFloat(cs.fontSize) || 10) / 10;
  let alpha = 1;

  const text = (s: string, x: number, y: number, color: string, align: CanvasTextAlign = "left", weight = 400, size = 10) => {
    ctx.font = `${weight} ${size * scale}px ${family}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(s, x, y);
  };
  const arrow = (p: Pt, angle: number, color = C.faint) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-5, -3.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-5, 3.5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };
  return {
    C,
    text,
    arrow,
    /** Moving parts fade out together at the end of a loop. */
    setAlpha(a: number) { alpha = a; },
    measure(s: string, size = 10, weight = 400) {
      ctx.font = `${weight} ${size * scale}px ${family}`;
      return ctx.measureText(s).width;
    },
    box(x: number, y: number, w: number, h: number, label: string, state: BoxState = "idle") {
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
      ctx.fillStyle = state === "lit" ? C.ink : C.bg;
      ctx.fill();
      ctx.strokeStyle = state === "idle" ? C.faint : C.ink;
      ctx.lineWidth = 1;
      ctx.stroke();
      text(label, x, y + 0.5, state === "lit" ? C.bg : state === "active" ? C.ink : C.muted, "center", state === "idle" ? 400 : 600);
    },
    line(a: Pt, b: Pt, color = C.rule, head = true) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (head) arrow(b, Math.atan2(b.y - a.y, b.x - a.x));
    },
    curve(a: Pt, c: Pt, b: Pt, color = C.rule, head = true) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (head) arrow(b, Math.atan2(b.y - c.y, b.x - c.x));
    },
    dot(p: Pt) {
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    rule(x1: number, x2: number, y: number) {
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1;
      ctx.stroke();
    },
  };
}
export type Pen = ReturnType<typeof pen>;

/**
 * Runs `draw` every frame while the canvas is on screen, with t looping over
 * `loop` ms. Under reduced motion it draws `still` once, and again when the
 * theme or the size changes.
 */
export function useDiagram(
  ref: RefObject<HTMLCanvasElement | null>,
  loop: number,
  still: number,
  draw: (p: Pen, ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
) {
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;

    const frame = (t: number) => {
      const ctx = cv.getContext("2d");
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!ctx || !w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw(pen(ctx, cv), ctx, w, h, t);
    };

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const once = () => frame(still);
      once();
      const mo = new MutationObserver(once);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
      const ro = new ResizeObserver(once);
      ro.observe(cv);
      return () => { mo.disconnect(); ro.disconnect(); };
    }

    let raf = 0, t0 = 0, n = 0, visible = true;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      if (n++ % 6 === 0) {
        const r = cv.getBoundingClientRect();
        visible = r.bottom > 0 && r.top < window.innerHeight;
      }
      if (visible) frame((now - t0) % loop);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // draw is a module-level function in each diagram, so it never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop, still]);
}
