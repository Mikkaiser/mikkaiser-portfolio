import type { ReactNode } from "react";

type Step = { title: string; text: ReactNode };

/**
 * Sits under a dense code card and says what the code does, step by step, so
 * a reader who skips the code still follows the post. The steps are the same
 * for every language tab. `back` draws the loop: after step `after`, return to
 * step `to`.
 */
export function InPlainWords({ intro, steps, back }: { intro: ReactNode; steps: Step[]; back?: { after: number; to: number } }) {
  return (
    <aside className="plain" aria-label="What this code does, in plain words" tabIndex={-1}>
      <div className="plain__label">In plain words</div>
      <p className="plain__intro">{intro}</p>
      <ol className="plain__steps">
        {steps.map((s, i) => (
          <li key={s.title} className={back && i + 1 === back.after ? "plain__step plain__step--back" : "plain__step"}>
            <span className="plain__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <strong className="plain__title">{s.title}</strong> {s.text}
              {back && i + 1 === back.after ? <div className="plain__back">↑ Back to step {back.to}</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
