import type { ReactNode } from "react";

type Line = { role: "user" | "assistant"; text: ReactNode };

/**
 * What a code card above would print: a short chat, message by message, then
 * the close of the conversation. Static, so it reads from any entry point.
 */
export function Exchange({ label, lines, end }: { label: string; lines: Line[]; end: ReactNode }) {
  return (
    <figure className="exchange" aria-label={label}>
      <div className="exchange__label">{label}</div>
      {lines.map((l) => (
        <div key={l.role} className={`exchange__row exchange__row--${l.role}`}>
          <span className="exchange__role">{l.role === "user" ? "User" : "Model"}</span>
          <p className="exchange__text">{l.text}</p>
        </div>
      ))}
      <div className="exchange__end">{end}</div>
    </figure>
  );
}
