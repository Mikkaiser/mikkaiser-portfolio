"use client";

import { useRef } from "react";
import { clamp, seg, useDiagram, within, type Pen } from "./diagram";

const LOOP = 9400;
const FADE = 8200;

// The milk question, message by message. `at` is when the message joins the list.
const ROWS = [
  { role: "SYSTEM", text: "You help a small corner store.", at: 0 },
  { role: "USER", text: "Do you have milk? How much?", at: 0 },
  { role: "ASSISTANT", text: "check_stock(milk), get_price(milk)", at: 2000 },
  { role: "TOOL", text: "12 in stock", at: 2900 },
  { role: "TOOL", text: "7.00 AED", at: 3500 },
  { role: "ASSISTANT", text: "Yes! 12 bottles, 7.00 AED each.", at: 6000 },
];
// Each model call sends every message so far.
const SENDS = [{ from: 700, to: 1900, rows: 2 }, { from: 3900, to: 5200, rows: 5 }];

const status = (t: number) =>
  t < 700 ? "" :
  t < 1900 ? "CALL 1 · SENDS 2 MESSAGES" :
  t < 2500 ? "THE MODEL ASKS FOR TOOLS" :
  t < 3900 ? "YOUR CODE RUNS THEM" :
  t < 5200 ? "CALL 2 · SENDS 5 MESSAGES" :
  t < 6400 ? "THE MODEL ANSWERS IN TEXT" : "DONE · 2 CALLS";

function draw(p: Pen, ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const { C } = p;
  const fade = 1 - seg(t, FADE, LOOP);
  const pad = 14;
  const fs = w < 480 ? 9.5 : 11;
  const top = 38;
  const rowH = clamp((h - top - 10) / ROWS.length, 22, 40);
  const roleW = p.measure("ASSISTANT", fs) + 16;
  const xB2 = w - pad - 4, xB1 = xB2 - 22;
  const rowY = (i: number) => top + rowH * (i + 0.5);

  p.text("THE CONVERSATION", pad, 18, C.faint);
  const s = status(t);
  ctx.globalAlpha = fade;
  if (s) p.text(s, w - pad, 18, t >= 6400 ? C.ink : C.faint, "right", t >= 6400 ? 600 : 400);
  ctx.globalAlpha = 1;
  p.rule(pad, w - pad, top - 6);

  // Messages: each one slides in when it joins, lit for a moment, then settles.
  ROWS.forEach((r, i) => {
    const shown = r.at === 0 ? 1 : seg(t, r.at, r.at + 400);
    const a = r.at === 0 ? 1 : shown * fade;
    if (a <= 0.01) return;
    const y = rowY(i);
    const fresh = r.at > 0 && within(t, r.at, r.at + 1400);
    ctx.globalAlpha = a;
    if (fresh) {
      ctx.fillStyle = C.raised;
      ctx.fillRect(pad, y - rowH / 2 + 1, xB1 - 10 - pad, rowH - 2);
    }
    const dx = (1 - shown) * 8;
    p.text(r.role, pad + 8 + dx, y, C.faint, "left", 400, fs);
    p.text(r.text, pad + roleW + dx, y, fresh ? C.ink : C.soft, "left", fresh ? 600 : 400, fs);
    ctx.globalAlpha = 1;
    if (i < ROWS.length - 1) p.rule(pad, xB1 - 10, y + rowH / 2);
  });

  // A bracket per call, spanning the messages it sent.
  SENDS.forEach((c, n) => {
    if (t < c.from) return;
    const x = n === 0 ? xB1 : xB2;
    const y0 = top + 3, y1 = top + rowH * c.rows - 3;
    const u = seg(t, c.from, c.from + 700);
    const active = within(t, c.from, c.to);
    ctx.globalAlpha = fade;
    ctx.strokeStyle = active ? C.ink : C.faint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 5, y0);
    ctx.lineTo(x, y0);
    ctx.lineTo(x, y0 + (y1 - y0) * u);
    if (u >= 1) ctx.lineTo(x - 5, y1);
    ctx.stroke();
    p.text(String(n + 1), x, y1 + 11, active ? C.ink : C.faint, "center", active ? 600 : 400);
    ctx.globalAlpha = 1;
  });
}

/** What the loop actually sends: the whole conversation, every call, growing as tools answer. */
export function ConversationGrows() {
  const ref = useRef<HTMLCanvasElement>(null);
  useDiagram(ref, LOOP, 8000, draw);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="The conversation as a list of messages. Call 1 sends the system and user messages. The model replies with two tool calls, check_stock and get_price, and the code adds their results, 12 in stock and 7.00 AED. Call 2 sends all five messages, and the model answers in text: 12 bottles, 7.00 AED each."
    />
  );
}
