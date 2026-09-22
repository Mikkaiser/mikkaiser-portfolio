import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { BIO } from "@/lib/bio";

export const runtime = "nodejs";

const MAX_TURNS = 20;
const MAX_CHARS = 2000;

type Turn = { role: "user" | "assistant"; content: string };

function parseTurns(input: unknown): Turn[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_TURNS) return null;
  const turns: Turn[] = [];
  for (const m of input) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const text = content.trim();
    if (!text || text.length > MAX_CHARS) return null;
    turns.push({ role, content: text });
  }
  if (turns[turns.length - 1].role !== "user") return null;
  return turns;
}

const client = new Anthropic();

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const turns = parseTurns((body as { messages?: unknown })?.messages);
  if (!turns) {
    return NextResponse.json({ error: "Expected { messages: [{ role, content }] }." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ask: ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "The agent is not configured yet. Email mikkaiser.ribeiro@gmail.com instead." }, { status: 503 });
  }

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: BIO, cache_control: { type: "ephemeral" } }],
      messages: turns,
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({
        reply: "I cannot help with that one. Ask something about Mikael's work, stack or background.",
      });
    }

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return NextResponse.json({ reply: reply || "No answer came back. Try again in a moment." });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Too many questions right now. Try again in a minute." }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("ask: ANTHROPIC_API_KEY is missing or invalid");
      return NextResponse.json({ error: "The agent is not configured." }, { status: 500 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("ask: API error", error.status, error.message);
      return NextResponse.json({ error: "That did not go through." }, { status: 502 });
    }
    console.error("ask: unexpected", error);
    return NextResponse.json({ error: "That did not go through." }, { status: 500 });
  }
}
