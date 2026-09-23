"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent" | "error";

const LABEL: Record<Status, string> = {
  idle: "Send message",
  sending: "Sending",
  sent: "Sent ↗",
  error: "Try again",
};

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [note, setNote] = useState("Straight to my inbox");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const f = new FormData(form);
    setStatus("sending");
    setNote("Sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(f.get("name") || ""),
          email: String(f.get("email") || ""),
          message: String(f.get("message") || ""),
          company: String(f.get("company") || ""), // honeypot
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (res.ok && data.ok) {
        form.reset();
        setStatus("sent");
        setNote("Thanks, I will reply soon");
        setTimeout(() => {
          setStatus("idle");
          setNote("Straight to my inbox");
        }, 6000);
      } else {
        setStatus("error");
        setNote(data.error || "That did not go through");
      }
    } catch {
      setStatus("error");
      setNote("Network error. Try again, or email me directly");
    }
  };

  return (
    <form onSubmit={onSubmit} aria-label="Send a message" className="form">
      <div className="ctrow">
        <label className="field">
          <span>Name</span>
          <input name="name" type="text" required maxLength={100} autoComplete="name" placeholder="Your name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@company.com" />
        </label>
      </div>
      <label className="field">
        <span>Message</span>
        <textarea name="message" required rows={5} maxLength={4000} placeholder="What are you building, and where does it hurt?" />
      </label>
      {/* Honeypot: hidden from people, irresistible to bots. */}
      <input
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <div className="form__foot">
        <span aria-live="polite" className="form__status">{note}</span>
        <button type="submit" disabled={status === "sending"} className="btn btn--primary form__submit">
          {LABEL[status]}
        </button>
      </div>
    </form>
  );
}
