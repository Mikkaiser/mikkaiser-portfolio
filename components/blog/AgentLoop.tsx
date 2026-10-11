"use client";

import { useRef } from "react";
import { clamp, lerp, quad, seg, useDiagram, within, type Pen } from "./diagram";

const LOOP = 14000;
const FADE = 12800;

// The agent lane: three model calls, two of them answered by a tool.
const CALLS = [
  { think: 1000, down: 1500, tool: 2500, up: 2900, done: 3900, name: "check_stock", result: "12 left" },
  { think: 3900, down: 4400, tool: 5400, up: 5800, done: 6800, name: "get_price", result: "7.00 AED" },
];
const FINAL = { think: 6800, out: 7300, lit: 8500 };
const SINGLE = { think: 1000, out: 1500, lit: 2700 };

function draw(p: Pen, _ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const { C } = p;
  const fade = 1 - seg(t, FADE, LOOP);
  p.setAlpha(fade);
  const k = clamp(h / 260, 0.8, 1.25);
  const pad = 14;
  const bw = clamp(w * 0.15, 54, 96), bh = 30 * k;
  const xU = w * 0.07, xL = w * 0.4, xR = w * 0.86;
  const yA = h * 0.29, yB = h * 0.62, yT = h * 0.88;
  const bulge = clamp(w * 0.05, 22, 40);
  const lit = (from: number) => (t >= from && fade > 0.5 ? "lit" : "idle");
  const user = (y: number) => {
    p.dot({ x: xU, y });
    p.text("YOU", xU, y + 15, C.faint, "center");
  };
  const counter = (s: string, y: number, done: boolean) => {
    _ctx.globalAlpha = fade;
    p.text(s, w - pad, y, done ? C.ink : C.faint, "right", done ? 600 : 400);
    _ctx.globalAlpha = 1;
  };

  // ---- lane A: one call ----
  p.text("ONE LLM CALL", pad, 18, C.faint);
  const aIn = { a: { x: xU + 8, y: yA }, b: { x: xL - bw / 2 - 2, y: yA } };
  const aOut = { a: { x: xL + bw / 2 + 2, y: yA }, b: { x: xR - bw / 2 - 2, y: yA } };
  p.line(aIn.a, aIn.b);
  p.line(aOut.a, aOut.b);
  p.setAlpha(1); user(yA); p.setAlpha(fade);
  p.box(xL, yA, bw, bh, "LLM", within(t, SINGLE.think, SINGLE.out) ? "active" : "idle");
  p.box(xR, yA, bw, bh, "ANSWER", lit(SINGLE.lit));
  if (t < SINGLE.think) p.dot(lerp(aIn.a, aIn.b, seg(t, 0, SINGLE.think)));
  if (within(t, SINGLE.out, SINGLE.lit)) p.dot(lerp(aOut.a, aOut.b, seg(t, SINGLE.out, SINGLE.lit)));
  if (t >= SINGLE.lit) counter("1 CALL · DONE", 18, true);
  else if (t >= SINGLE.think) counter("1 CALL", 18, false);

  p.rule(pad, w - pad, h * 0.5 - 14);

  // ---- lane B: the agent loop ----
  p.text("AGENT LOOP", pad, h * 0.5, C.faint);
  const bIn = { a: { x: xU + 8, y: yB }, b: { x: xL - bw / 2 - 2, y: yB } };
  const bOut = { a: { x: xL + bw / 2 + 2, y: yB }, b: { x: xR - bw / 2 - 2, y: yB } };
  // The call goes down the right of the pair, the result comes back up the left.
  const down = { a: { x: xL + bw * 0.3, y: yB + bh / 2 + 2 }, c: { x: xL + bw / 2 + bulge, y: (yB + yT) / 2 }, b: { x: xL + bw * 0.3, y: yT - bh / 2 - 2 } };
  const up = { a: { x: xL - bw * 0.3, y: yT - bh / 2 - 2 }, c: { x: xL - bw / 2 - bulge, y: (yB + yT) / 2 }, b: { x: xL - bw * 0.3, y: yB + bh / 2 + 2 } };
  p.line(bIn.a, bIn.b);
  p.line(bOut.a, bOut.b);
  p.curve(down.a, down.c, down.b);
  p.curve(up.a, up.c, up.b);
  p.setAlpha(1); user(yB); p.setAlpha(fade);

  const step = CALLS.find((s) => within(t, s.think, s.done));
  const thinking = CALLS.some((s) => within(t, s.think, s.down)) || within(t, FINAL.think, FINAL.out);
  const tooling = CALLS.some((s) => within(t, s.tool, s.up));
  p.box(xL, yB, bw, bh, "LLM", thinking ? "active" : "idle");
  p.box(xL, yT, bw, bh, "TOOLS", tooling ? "active" : "idle");
  p.box(xR, yB, bw, bh, "ANSWER", lit(FINAL.lit));

  // What travels the loop right now, faint generic labels otherwise.
  const callLabel = step && within(t, step.down, step.up) ? step.name : null;
  const resultLabel = step && within(t, step.tool, step.done) ? step.result : null;
  const midY = (yB + yT) / 2;
  p.text(callLabel ?? "tool call", xL + bw / 2 + bulge * 0.62 + 6, midY, callLabel ? C.ink : C.faint, "left", callLabel ? 600 : 400);
  p.text(resultLabel ?? "result", xL - bw / 2 - bulge * 0.62 - 6, midY, resultLabel ? C.ink : C.faint, "right", resultLabel ? 600 : 400);

  if (t < 1000) p.dot(lerp(bIn.a, bIn.b, seg(t, 0, 1000)));
  for (const s of CALLS) {
    if (within(t, s.down, s.tool)) p.dot(quad(down.a, down.c, down.b, seg(t, s.down, s.tool)));
    if (within(t, s.up, s.done)) p.dot(quad(up.a, up.c, up.b, seg(t, s.up, s.done)));
  }
  if (within(t, FINAL.out, FINAL.lit)) p.dot(lerp(bOut.a, bOut.b, seg(t, FINAL.out, FINAL.lit)));

  const calls = t >= FINAL.think ? 3 : t >= CALLS[1].think ? 2 : t >= CALLS[0].think ? 1 : 0;
  if (t >= FINAL.lit) counter("3 CALLS · DONE", h * 0.5, true);
  else if (calls) counter(`CALL ${calls}`, h * 0.5, false);
}

/**
 * One LLM call against an agent: the same question, answered once from what
 * the model already knows, or by calling the model again after every tool
 * result until it can answer.
 */
export function AgentLoop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useDiagram(ref, LOOP, 9500, draw);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Top: a question goes to the LLM and one answer comes back, after one call. Bottom: the agent sends the question to the LLM, which calls a tool, gets the result back and calls the model again, twice, before the final answer goes out after three calls."
    />
  );
}
