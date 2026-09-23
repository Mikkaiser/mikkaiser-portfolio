import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const TO = "mikkaiser.ribeiro@gmail.com";
// mikkaiser.com is a verified Resend sending domain (SPF on send., DKIM on resend._domainkey).
const FROM = "Portfolio <noreply@mikkaiser.com>";

const LIMITS = { name: 100, email: 200, message: 4000 };
// Small in-memory throttle. Per instance only, so it is a speed bump for casual
// abuse rather than a guarantee; the honeypot catches most bots.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const esc = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, email, message, company } = (body ?? {}) as Record<string, unknown>;

  // Honeypot: real people never see this field, bots fill it in.
  if (typeof company === "string" && company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const n = name.trim();
  const e = email.trim();
  const m = message.trim();

  if (!n || !e || !m) return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
  if (n.length > LIMITS.name || e.length > LIMITS.email || m.length > LIMITS.message) {
    return NextResponse.json({ error: "That message is too long." }, { status: 400 });
  }
  if (!isEmail(e)) return NextResponse.json({ error: "That email address does not look right." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many messages. Try again in a minute." }, { status: 429 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("contact: RESEND_API_KEY is not set");
    return NextResponse.json(
      { error: "The form is not configured yet. Email mikkaiser.ribeiro@gmail.com instead." },
      { status: 503 },
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: e, // hitting reply answers the visitor directly
      subject: `Portfolio message from ${n}`,
      text: `${m}\n\n---\nFrom: ${n} <${e}>\nSent from mikkaiser.com`,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6">
  <p style="white-space:pre-wrap;margin:0 0 20px">${esc(m)}</p>
  <hr style="border:0;border-top:1px solid #e5e5e5;margin:20px 0">
  <p style="color:#666;margin:0;font-size:13px">
    From <strong>${esc(n)}</strong> &lt;<a href="mailto:${esc(e)}">${esc(e)}</a>&gt;<br>Sent from mikkaiser.com
  </p>
</div>`,
    });

    if (error) {
      console.error("contact: resend error", error);
      return NextResponse.json({ error: "That did not go through. Try again in a moment." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("contact: unexpected", err);
    return NextResponse.json({ error: "That did not go through. Try again in a moment." }, { status: 500 });
  }
}
