"use client";

import { useRef } from "react";
import { clamp, lerp, quad, seg, useDiagram, within, type Pen, type Pt } from "./diagram";

const RUN = 8000;
const LOOP = RUN * 2;

// The workflow: the same three steps, in the same order, every run.
const FIXED = ["check_stock", "get_price", "LLM reply"];
const FIXED_AT = [{ in: 0, on: 700, off: 1500 }, { in: 1500, on: 2200, off: 3000 }, { in: 3000, on: 3700, off: 4500 }];

// The agent: the model picks the next step itself, so the order can change.
const OPTIONS = ["check_stock", "get_price", "ANSWER"];
const PICKS = [[1, 0, 2], [0, 1, 2]];
// Per pick: think, go, use, back. The last pick (the answer) has no way back.
const PICK_AT = [
  { think: 0, go: 900, use: 1700, back: 2100, done: 2900 },
  { think: 2900, go: 3800, use: 4600, back: 5000, done: 5800 },
  { think: 5800, go: 6500, use: 7100, back: RUN, done: RUN },
];

function draw(p: Pen, ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const { C } = p;
  const run = Math.floor(t / RUN) % 2;
  const r = t % RUN;
  const fade = 1 - seg(r, RUN - 600, RUN);
  p.setAlpha(fade);
  const pad = 14;
  const k = clamp(h / 260, 0.8, 1.25);
  const bh = 30 * k;
  const bwStep = clamp(w * 0.22, 74, 120);

  // ---- lane A: workflow ----
  // Low enough that the step numbers clear the lane header on short canvases.
  const yA = Math.max(h * 0.24, 44 + bh / 2);
  p.text("WORKFLOW", pad, 18, C.faint);
  p.text("YOUR CODE PICKS THE ORDER", w - pad, 18, C.faint, "right");
  const xs = [w * 0.2, w * 0.5, w * 0.8];
  for (let i = 0; i < 2; i++) p.line({ x: xs[i] + bwStep / 2 + 2, y: yA }, { x: xs[i + 1] - bwStep / 2 - 2, y: yA });
  FIXED.forEach((label, i) => {
    const at = FIXED_AT[i];
    const state = within(r, at.on, at.off) ? "active" : i === 2 && r >= at.off && fade > 0.5 ? "lit" : "idle";
    p.box(xs[i], yA, bwStep, bh, label, state);
    p.text(String(i + 1), xs[i], yA - bh / 2 - 9, C.faint, "center");
  });
  for (let i = 1; i < 3; i++) {
    const at = FIXED_AT[i];
    if (within(r, at.in, at.on)) p.dot(lerp({ x: xs[i - 1] + bwStep / 2 + 2, y: yA }, { x: xs[i] - bwStep / 2 - 2, y: yA }, seg(r, at.in, at.on)));
  }

  p.rule(pad, w - pad, h * 0.42);

  // ---- lane B: agent ----
  const yB = h * 0.75;
  const d = bh * 1.15;
  p.text("AGENT", pad, h * 0.42 + 14, C.faint);
  p.text("THE MODEL PICKS THE NEXT STEP", w - pad, h * 0.42 + 14, C.faint, "right");
  const bwL = clamp(w * 0.15, 54, 96);
  const xL = w * 0.22, xO = w * 0.7;
  const ys = [yB - d, yB, yB + d];
  const from: Pt = { x: xL + bwL / 2 + 2, y: yB };
  const path = (i: number) => {
    const to: Pt = { x: xO - bwStep / 2 - 2, y: ys[i] };
    return { a: from, c: { x: (from.x + to.x) / 2, y: ys[i] }, b: to };
  };
  OPTIONS.forEach((_, i) => { const q = path(i); p.curve(q.a, q.c, q.b); });

  const picks = PICKS[run];
  const now = PICK_AT.findIndex((s) => within(r, s.think, s.done));
  const thinking = now >= 0 && within(r, PICK_AT[now].think, PICK_AT[now].go);
  p.box(xL, yB, bwL, bh, "LLM", thinking ? "active" : "idle");
  if (thinking) p.text("?", xL, yB - bh / 2 - 10, C.ink, "center", 600, 11);

  OPTIONS.forEach((label, i) => {
    const order = picks.indexOf(i);
    const at = PICK_AT[order];
    const answer = i === 2;
    const state = answer ? (r >= at.use && fade > 0.5 ? "lit" : "idle") : within(r, at.use, at.back) ? "active" : "idle";
    p.box(xO, ys[i], bwStep, bh, label, state);
    // The order the model chose this run, revealed as it chooses.
    if (r >= at.go) {
      ctx.globalAlpha = fade;
      p.text(String(order + 1), xO + bwStep / 2 + 10, ys[i], C.ink, "left", 600);
      ctx.globalAlpha = 1;
    }
  });

  if (now >= 0) {
    const s = PICK_AT[now];
    const q = path(picks[now]);
    if (within(r, s.go, s.use)) p.dot(quad(q.a, q.c, q.b, seg(r, s.go, s.use)));
    if (within(r, s.back, s.done)) p.dot(quad(q.b, q.c, q.a, seg(r, s.back, s.done)));
  }
}

/** A workflow runs the steps your code fixed; an agent lets the model choose the next one. */
export function WorkflowVsAgent() {
  const ref = useRef<HTMLCanvasElement>(null);
  useDiagram(ref, LOOP, 7600, draw);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Top, a workflow: check_stock, then get_price, then the LLM reply, in the same order every run. Bottom, an agent: the LLM chooses between check_stock, get_price and answering. On one run it picks get_price first, on the next check_stock first, and it answers when it has both."
    />
  );
}
