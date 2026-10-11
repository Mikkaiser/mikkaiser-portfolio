import { CodeLights, highlight } from "./CodeSnap";

const LANGS = [
  { key: "py", lang: "python", name: "Python", file: "agent.py" },
  { key: "ts", lang: "ts", name: "TypeScript", file: "agent.ts" },
  { key: "cs", lang: "csharp", name: "C#", file: "Agent.cs" },
] as const;

type Key = (typeof LANGS)[number]["key"];

/** A short, stable name for the radio group, so each card's tabs are their own group. */
function groupName(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `code-${(h >>> 0).toString(36)}`;
}

/**
 * One snippet in Python, TypeScript and C#, as tabs in a single code card.
 * Python shows first. The tabs are radio buttons and CSS shows the matching
 * body, so they work without JavaScript; CodeLangSync makes a choice apply to
 * every card on the page and remembers it.
 */
export async function CodeTabs({ py, ts, cs, files = {} }: { py: string; ts: string; cs: string; files?: Partial<Record<Key, string>> }) {
  const code: Record<Key, string> = { py, ts, cs };
  const name = groupName(py + ts + cs);
  const bodies = await Promise.all(LANGS.map((l) => highlight(code[l.key], l.lang)));
  return (
    <figure className="code code--tabs">
      <div className="code__bar">
        <CodeLights />
        <fieldset className="code__tabs">
          <legend className="sr-only">Language</legend>
          {LANGS.map((l, i) => (
            <label key={l.key} className="code__tab">
              <input type="radio" name={name} value={l.key} defaultChecked={i === 0} />
              <span className="sr-only">{l.name}, </span>
              {files[l.key] ?? l.file}
            </label>
          ))}
        </fieldset>
      </div>
      {LANGS.map((l, i) => (
        <div
          key={l.key}
          className="code__body"
          data-lang={l.key}
          tabIndex={0}
          role="region"
          aria-label={`${l.name}, ${files[l.key] ?? l.file}`}
          dangerouslySetInnerHTML={{ __html: bodies[i] }}
        />
      ))}
    </figure>
  );
}
