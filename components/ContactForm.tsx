"use client";

import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "");
    const email = String(f.get("email") || "");
    const message = String(f.get("message") || "");
    const subj = encodeURIComponent(`Message from ${name || "your site"}`);
    const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
    window.location.href = `mailto:mikkaiser.ribeiro@gmail.com?subject=${subj}&body=${body}`;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <form onSubmit={onSubmit} aria-label="Send a message" className="form">
      <div className="ctrow">
        <label className="field"><span>Name</span><input name="name" type="text" required autoComplete="name" placeholder="Your name" /></label>
        <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" placeholder="you@company.com" /></label>
      </div>
      <label className="field"><span>Message</span><textarea name="message" required rows={5} placeholder="What are you building, and where does it hurt?" /></label>
      <div className="form__foot">
        <span aria-live="polite" className="form__status">{sent ? "Opening mail" : "Via your mail app"}</span>
        <button type="submit" className="btn btn--primary form__submit">{sent ? "Sent ↗" : "Send message"}</button>
      </div>
    </form>
  );
}
