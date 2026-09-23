"use client";

import { useRef, useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const sentRef = useRef<HTMLDivElement>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const f = new FormData(form);
    setStatus("sending");
    setError("");

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
        // Move focus to the confirmation so screen readers announce it.
        requestAnimationFrame(() => sentRef.current?.focus());
      } else {
        setStatus("error");
        setError(data.error || "That did not go through. Try again in a moment.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Try again, or email mikkaiser.ribeiro@gmail.com directly.");
    }
  };

  if (status === "sent") {
    return (
      <div className="form">
        <div className="form__sent" role="status" aria-live="polite" tabIndex={-1} ref={sentRef}>
          <span className="form__tick" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5 L9.5 18 L20 7" />
            </svg>
          </span>
          <h3>Message sent</h3>
          <p>Thanks for reaching out. It landed in my inbox and I reply within two days.</p>
          <button type="button" className="btn btn--ghost form__again" onClick={() => setStatus("idle")}>
            Send another
          </button>
        </div>
      </div>
    );
  }

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
      {status === "error" && (
        <p className="form__error" role="alert">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5h.01" />
          </svg>
          {error}
        </p>
      )}
      <div className="form__foot">
        <span aria-live="polite" className="form__status">
          {status === "sending" ? "Sending" : "Straight to my inbox"}
        </span>
        <button type="submit" disabled={status === "sending"} className="btn btn--primary form__submit">
          {status === "sending" ? "Sending" : "Send message"}
        </button>
      </div>
    </form>
  );
}
