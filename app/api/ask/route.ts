import { NextResponse } from "next/server";
import OpenAI from "openai";
import { BIO } from "@/lib/bio";

export const runtime = "nodejs";

// gpt-5.4-mini: small, fast and cheap, which suits short CV answers.
// Note it rejects `max_tokens` and requires `max_completion_tokens`.
const MODEL = "gpt-5.4-mini";
const MAX_TURNS = 20;
const MAX_CHARS = 2000;

const MAX_SUGGESTIONS = 3;

type Turn = { role: "user" | "assistant"; content: string };

// Every answer comes back with fresh follow-up questions for the cards under the
// chat, so a visitor always has somewhere to go next. Structured output keeps
// the reply and the suggestions apart without parsing prose.
const SUGGEST = `Reply with JSON matching the schema. "reply" is your answer to the visitor, written exactly as the rules above say. "suggestions" is ${MAX_SUGGESTIONS} short questions the visitor could ask you next, each under 50 characters, phrased about Mikael in the third person ("What did he build at ACTVET?"). Make the first one dig deeper into your answer and the others open a different part of his background (work, projects, stack, awards, teaching, education), so the visitor keeps discovering something new. Each must make sense on its own as a button, so name the employer, project or technology instead of writing "there", "it" or "that". Every one must be answerable from the facts above and different from anything the visitor has already asked. Never suggest personal or off-topic questions.`;

const FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "answer",
    strict: true,
    schema: {
      type: "object",
      properties: {
        reply: { type: "string" },
        suggestions: { type: "array", items: { type: "string" } },
      },
      required: ["reply", "suggestions"],
      additionalProperties: false,
    },
  },
} as const;

function parseAnswer(raw: string): { reply: string; suggestions: string[] } {
  try {
    const { reply, suggestions } = JSON.parse(raw) as { reply?: unknown; suggestions?: unknown };
    if (typeof reply !== "string") throw new Error("no reply");
    const list = Array.isArray(suggestions) ? suggestions : [];
    return {
      reply: reply.trim(),
      suggestions: list
        .filter((q): q is string => typeof q === "string")
        .map((q) => q.trim())
        .filter((q) => q && q.length <= 80)
        .slice(0, MAX_SUGGESTIONS),
    };
  } catch {
    // Not JSON after all: show what came back and let the client fill the cards.
    return { reply: raw.trim(), suggestions: [] };
  }
}

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

  if (!process.env.OPENAI_API_KEY) {
    console.error("ask: OPENAI_API_KEY is not set");
    return NextResponse.json({ error: "The agent is not configured yet. Email mikkaiser.ribeiro@gmail.com instead." }, { status: 503 });
  }

  try {
    const client = new OpenAI();
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 1024,
      response_format: FORMAT,
      messages: [{ role: "system", content: BIO }, { role: "system", content: SUGGEST }, ...turns],
    });

    const choice = completion.choices[0];
    if (choice?.finish_reason === "content_filter") {
      return NextResponse.json({
        reply: "I cannot help with that one. Ask something about Mikael's work, stack or background.",
      });
    }

    const { reply, suggestions } = parseAnswer(choice?.message?.content ?? "");
    return NextResponse.json({ reply: reply || "No answer came back. Try again in a moment.", suggestions });
  } catch (error) {
    if (error instanceof OpenAI.RateLimitError) {
      return NextResponse.json({ error: "Too many questions right now. Try again in a minute." }, { status: 429 });
    }
    if (error instanceof OpenAI.AuthenticationError) {
      console.error("ask: OPENAI_API_KEY is invalid");
      return NextResponse.json({ error: "The agent is not configured." }, { status: 500 });
    }
    if (error instanceof OpenAI.APIError) {
      console.error("ask: API error", error.status, error.message);
      return NextResponse.json({ error: "That did not go through." }, { status: 502 });
    }
    console.error("ask: unexpected", error);
    return NextResponse.json({ error: "That did not go through." }, { status: 500 });
  }
}
