"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { GREETING } from "@/lib/bio";
import { Spark } from "./icons";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS: { label: string; ask: string }[] = [
  { label: "What is his .NET experience?", ask: "What is his .NET experience?" },
  { label: "Biggest system he has worked on?", ask: "What is the biggest system he has worked on?" },
  { label: "Has he done Kubernetes in production?", ask: "Has he run Kubernetes in production?" },
];

const FAIL = "That did not go through. Try again in a moment, or email mikkaiser.ribeiro@gmail.com.";

// The agent answers in plain text, so its own references are turned into links
// here. Only these shapes qualify: an #anchor naming a section that exists, a
// full URL, an email address, or a bare domain on the short allowlist below.
// Bare domains are matched by host rather than by shape, so ".NET", "Next.js"
// and "ASP.NET Core" are never mistaken for links.
const SECTIONS: Record<string, string> = {
  top: "Top", work: "Work", experience: "Experience", awards: "Achievements",
  ask: "Ask about me", contact: "Contact", offline: "Offline",
};
const HOSTS = "mikkaiser\\.com|autege\\.com|techknowledge\\.blog|senai\\.br|emiratesskills\\.ae|linkedin\\.com|github\\.com";
const LINKABLE = new RegExp(
  [
    "(https?://[^\\s<>()]+[^\\s<>().,;:!?])",
    "([\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+)",
    `((?:[\\w-]+\\.)*(?:${HOSTS})(?:/[^\\s<>()]*[^\\s<>().,;:!?])?)`,
    "(#[a-z]{2,12})\\b",
  ].join("|"),
  "gi",
);

function linkify(text: string) {
  const out: (string | React.ReactElement)[] = [];
  let last = 0;
  for (const m of text.matchAll(LINKABLE)) {
    const [raw, url, email, domain, anchor] = m;
    const at = m.index;
    const section = anchor ? SECTIONS[anchor.slice(1).toLowerCase()] : undefined;
    if (anchor && !section) continue;
    if (at > last) out.push(text.slice(last, at));
    const external = Boolean(url || domain);
    const href = url ? raw : domain ? `https://${raw}` : email ? `mailto:${raw}` : anchor.toLowerCase();
    // The model usually writes "the #contact section", so do not repeat the word.
    const label = section ?? raw;
    const rest = text.slice(at + raw.length);
    if (section && /^\s+section\b/i.test(rest)) last = at + raw.length + rest.match(/^\s+section/i)![0].length;
    else last = at + raw.length;
    out.push(
      <a key={at} href={href} className="msg__link" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {section ? `${label} section` : label}
      </a>,
    );
  }
  if (!out.length) return text;
  out.push(text.slice(last));
  return out;
}

export function Ask() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, busy]);

  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const history = next.filter((m) => m.content !== GREETING);
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      const reply = res.ok && data.reply ? data.reply : data.error || FAIL;
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: FAIL }]);
    } finally {
      setBusy(false);
    }
  }, [busy, messages]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <section id="ask" className="section section--lazy" aria-labelledby="ask-h">
      <div className="section-head" data-anim>
        <h2 id="ask-h" className="with-spark"><Spark size={12} className="spark spark--twinkle" />Ask about me</h2>
        <span className="eyebrow">AI, answers from my CV</span>
      </div>
      <div className="ask" data-anim>
        <div className="ask__head">
          <span aria-hidden="true" className="ask__avatar"><Spark size={20} className="spark spark--twinkle" /></span>
          <div style={{ minWidth: 0 }}>
            <div className="ask__name">Mikkaiser agent</div>
            <p className="small ask__intro">
              An agent with my CV, projects and stack in front of it. Ask what I have built, what I know, or whether I have worked with the technology you need.
            </p>
          </div>
        </div>
        <div id="ask-log" className="ask__log" ref={logRef} aria-live="polite">
          {messages.map((m, i) => (
            <div className={`msg${m.role === "user" ? " msg--user" : ""}`} key={i}>
              {m.role === "assistant" && <span aria-hidden="true" className="msg__spark"><Spark size={14} /></span>}
              <div className="msg__bubble">{m.role === "assistant" ? linkify(m.content) : m.content}</div>
            </div>
          ))}
          {busy && (
            <div className="msg msg--busy">
              <span aria-hidden="true" className="msg__spark"><Spark size={14} /></span>
              <div className="msg__bubble">Thinking...</div>
            </div>
          )}
        </div>
        <div className="ask__suggest">
          {SUGGESTIONS.map((s) => (
            <button type="button" className="btn btn--ghost" key={s.ask} onClick={() => send(s.ask)} disabled={busy}>{s.label}</button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="ask__form">
          <label htmlFor="ask-input" className="sr">Ask a question about Mikael</label>
          <input
            id="ask-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about my background"
            className="ask__input"
            maxLength={2000}
            autoComplete="off"
          />
          <button type="submit" disabled={busy} className="btn btn--primary ask__send"><Spark size={14} />{busy ? "Sending" : "Ask"}</button>
        </form>
      </div>
    </section>
  );
}
