"use client";

import { useEffect, useRef } from "react";

const LOOP = 14000;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** Progress of t through [a, b], eased, 0 before and 1 after. */
const seg = (t: number, a: number, b: number) => {
  const u = clamp((t - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};
const within = (t: number, a: number, b: number) => t >= a && t < b;

// The agent lane: three model calls, two of them answered by a tool.
const CALLS = [
  { think: 1000, down: 1500, tool: 2500, up: 2900, done: 3900, name: "check_stock", result: "12 left" },
  { think: 3900, down: 4400, tool: 5400, up: 5800, done: 6800, name: "get_price", result: "7.00 AED" },
];
const FINAL = { think: 6800, out: 7300, lit: 8500 };
const SINGLE = { think: 1000, out: 1500, lit: 2700 };
const FADE = 12800;

type Pt = { x: number; y: number };
const quad = (a: Pt, c: Pt, b: Pt, u: number): Pt => ({
  x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
  y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
});

/**
 * One LLM call against an agent: the same question, answered once from what
 * the model already knows, or by calling the model again after every tool
 * result until it can answer. Page palette only, drawn while on screen, one
 * still frame under reduced motion.
 */
export function AgentLoop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;

    const draw = (t: number) => {
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

      // Colours and the mono family come off the page at paint time, so the theme switch just works.
      const cs = getComputedStyle(cv);
      const c = (n: string) => cs.getPropertyValue(n).trim();
      const C = { ink: c("--ink"), faint: c("--faint"), muted: c("--muted"), rule: c("--rule"), bg: c("--bg") };
      const font = (weight: number) => `${weight} 10px ${cs.fontFamily}`;

      const fade = 1 - seg(t, FADE, LOOP);
      const k = clamp(h / 260, 0.8, 1.25);
      const pad = 14;
      const bw = clamp(w * 0.15, 54, 96), bh = 30 * k;
      const xU = w * 0.07, xL = w * 0.4, xR = w * 0.86;
      const yA = h * 0.29, yB = h * 0.62, yT = h * 0.88;
      const bulge = clamp(w * 0.05, 22, 40);

      const text = (s: string, x: number, y: number, color: string, align: CanvasTextAlign = "left", weight = 400) => {
        ctx.font = font(weight);
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = "middle";
        ctx.fillText(s, x, y);
      };
      const box = (x: number, y: number, label: string, state: "idle" | "active" | "lit") => {
        const r = 4, x0 = x - bw / 2, y0 = y - bh / 2;
        ctx.beginPath();
        ctx.roundRect(x0, y0, bw, bh, r);
        ctx.fillStyle = state === "lit" ? C.ink : C.bg;
        ctx.fill();
        ctx.strokeStyle = state === "idle" ? C.faint : C.ink;
        ctx.lineWidth = 1;
        ctx.stroke();
        text(label, x, y + 0.5, state === "lit" ? C.bg : state === "active" ? C.ink : C.muted, "center", state === "idle" ? 400 : 600);
      };
      const arrow = (p: Pt, angle: number) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-5, -3.5);
        ctx.lineTo(0, 0);
        ctx.lineTo(-5, 3.5);
        ctx.strokeStyle = C.faint;
        ctx.stroke();
        ctx.restore();
      };
      const line = (a: Pt, b: Pt) => {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = C.rule;
        ctx.stroke();
        arrow(b, Math.atan2(b.y - a.y, b.x - a.x));
      };
      const curve = (a: Pt, ctl: Pt, b: Pt) => {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(ctl.x, ctl.y, b.x, b.y);
        ctx.strokeStyle = C.rule;
        ctx.stroke();
        arrow(b, Math.atan2(b.y - ctl.y, b.x - ctl.x));
      };
      const dot = (p: Pt) => {
        ctx.globalAlpha = fade;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = C.ink;
        ctx.fill();
        ctx.globalAlpha = 1;
      };
      const lerp = (a: Pt, b: Pt, u: number): Pt => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
      const user = (y: number) => {
        ctx.beginPath();
        ctx.arc(xU, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = C.ink;
        ctx.fill();
        text("YOU", xU, y + 15, C.faint, "center");
      };

      // ---- lane A: one call ----
      text("ONE LLM CALL", pad, 18, C.faint);
      const aIn = { a: { x: xU + 8, y: yA }, b: { x: xL - bw / 2 - 2, y: yA } };
      const aOut = { a: { x: xL + bw / 2 + 2, y: yA }, b: { x: xR - bw / 2 - 2, y: yA } };
      line(aIn.a, aIn.b);
      line(aOut.a, aOut.b);
      user(yA);
      box(xL, yA, "LLM", within(t, SINGLE.think, SINGLE.out) ? "active" : "idle");
      box(xR, yA, "ANSWER", t >= SINGLE.lit && t < LOOP ? (fade > 0.5 ? "lit" : "idle") : "idle");
      if (t < SINGLE.think) dot(lerp(aIn.a, aIn.b, seg(t, 0, SINGLE.think)));
      if (within(t, SINGLE.out, SINGLE.lit)) dot(lerp(aOut.a, aOut.b, seg(t, SINGLE.out, SINGLE.lit)));
      ctx.globalAlpha = fade;
      if (t >= SINGLE.lit) text("1 CALL · DONE", w - pad, 18, C.ink, "right", 600);
      else if (t >= SINGLE.think) text("1 CALL", w - pad, 18, C.faint, "right");
      ctx.globalAlpha = 1;

      // ---- divider ----
      ctx.beginPath();
      ctx.moveTo(pad, h * 0.5 - 14);
      ctx.lineTo(w - pad, h * 0.5 - 14);
      ctx.strokeStyle = C.rule;
      ctx.stroke();

      // ---- lane B: the agent loop ----
      text("AGENT LOOP", pad, h * 0.5, C.faint);
      const bIn = { a: { x: xU + 8, y: yB }, b: { x: xL - bw / 2 - 2, y: yB } };
      const bOut = { a: { x: xL + bw / 2 + 2, y: yB }, b: { x: xR - bw / 2 - 2, y: yB } };
      // The call goes down the right of the pair, the result comes back up the left.
      const down = { a: { x: xL + bw * 0.3, y: yB + bh / 2 + 2 }, c: { x: xL + bw / 2 + bulge, y: (yB + yT) / 2 }, b: { x: xL + bw * 0.3, y: yT - bh / 2 - 2 } };
      const up = { a: { x: xL - bw * 0.3, y: yT - bh / 2 - 2 }, c: { x: xL - bw / 2 - bulge, y: (yB + yT) / 2 }, b: { x: xL - bw * 0.3, y: yB + bh / 2 + 2 } };
      line(bIn.a, bIn.b);
      line(bOut.a, bOut.b);
      curve(down.a, down.c, down.b);
      curve(up.a, up.c, up.b);
      user(yB);

      const step = CALLS.find((s) => within(t, s.think, s.done));
      const thinking = CALLS.some((s) => within(t, s.think, s.down)) || within(t, FINAL.think, FINAL.out);
      const tooling = CALLS.some((s) => within(t, s.tool, s.up));
      box(xL, yB, "LLM", thinking ? "active" : "idle");
      box(xL, yT, "TOOLS", tooling ? "active" : "idle");
      box(xR, yB, "ANSWER", t >= FINAL.lit && fade > 0.5 ? "lit" : "idle");

      // What travels the loop right now, faint generic labels otherwise.
      const callLabel = step && within(t, step.down, step.up) ? step.name : null;
      const resultLabel = step && within(t, step.tool, step.done) ? step.result : null;
      const midY = (yB + yT) / 2;
      text(callLabel ?? "tool call", xL + bw / 2 + bulge * 0.62 + 6, midY, callLabel ? C.ink : C.faint, "left", callLabel ? 600 : 400);
      text(resultLabel ?? "result", xL - bw / 2 - bulge * 0.62 - 6, midY, resultLabel ? C.ink : C.faint, "right", resultLabel ? 600 : 400);

      if (t < 1000) dot(lerp(bIn.a, bIn.b, seg(t, 0, 1000)));
      for (const s of CALLS) {
        if (within(t, s.down, s.tool)) dot(quad(down.a, down.c, down.b, seg(t, s.down, s.tool)));
        if (within(t, s.up, s.done)) dot(quad(up.a, up.c, up.b, seg(t, s.up, s.done)));
      }
      if (within(t, FINAL.out, FINAL.lit)) dot(lerp(bOut.a, bOut.b, seg(t, FINAL.out, FINAL.lit)));

      const calls = t >= FINAL.think ? 3 : t >= CALLS[1].think ? 2 : t >= CALLS[0].think ? 1 : 0;
      ctx.globalAlpha = fade;
      if (t >= FINAL.lit) text("3 CALLS · DONE", w - pad, h * 0.5, C.ink, "right", 600);
      else if (calls) text(`CALL ${calls}`, w - pad, h * 0.5, C.faint, "right");
      ctx.globalAlpha = 1;
    };

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // One still frame with both answers in, redrawn on theme or size changes.
      const still = () => draw(9500);
      still();
      const mo = new MutationObserver(still);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
      const ro = new ResizeObserver(still);
      ro.observe(cv);
      return () => { mo.disconnect(); ro.disconnect(); };
    }

    let raf = 0, t0 = 0, frame = 0, visible = true;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      if (frame++ % 6 === 0) {
        const r = cv.getBoundingClientRect();
        visible = r.bottom > 0 && r.top < window.innerHeight;
      }
      if (visible) draw((now - t0) % LOOP);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Top: a question goes to the LLM and one answer comes back, after one call. Bottom: the agent sends the question to the LLM, which calls a tool, gets the result back and calls the model again, twice, before the final answer goes out after three calls."
    />
  );
}
