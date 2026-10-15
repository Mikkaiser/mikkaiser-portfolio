import { bundledThemes, createHighlighter, type BundledLanguage, type Highlighter, type ShikiTransformer, type ThemeRegistration, type ThemedToken } from "shiki";

const LANGS: BundledLanguage[] = ["ts", "tsx", "js", "jsx", "css", "html", "json", "bash", "csharp", "python", "sql", "yaml"];

// Dracula colours function names green, but its Python grammar scopes a plain call like
// create(...) as meta.function-call.generic, which the stock theme leaves uncoloured.
// TypeScript and C# already come out green, so Python gets the one missing rule.
const THEME = "dracula-calls";
async function theme(): Promise<ThemeRegistration> {
  const dracula = (await bundledThemes.dracula()).default;
  return {
    ...dracula,
    name: THEME,
    tokenColors: [...(dracula.tokenColors ?? []), { scope: ["meta.function-call.generic.python"], settings: { foreground: "#50FA7B" } }],
  };
}

// Python's grammar leaves imported and annotated class names as plain text (and calls
// like Agent(...) as functions). By convention a CapWords name is a class, so Python
// gets Dracula's class colour for those. ALL_CAPS constants don't match.
const DEFAULT_FG = "#F8F8F2", CALL_GREEN = "#50FA7B", CLASS_CYAN = "#8BE9FD";
const CAP_WORD = /\b[A-Z][A-Za-z0-9]*[a-z][A-Za-z0-9]*\b/g;
const pythonClasses: ShikiTransformer = {
  tokens(lines) {
    for (const line of lines) {
      const out: ThemedToken[] = [];
      for (const t of line) {
        const color = t.color?.toUpperCase();
        if (color !== DEFAULT_FG && color !== CALL_GREEN) { out.push(t); continue; }
        let at = 0;
        for (const m of t.content.matchAll(CAP_WORD)) {
          if (m.index > at) out.push({ ...t, content: t.content.slice(at, m.index), offset: t.offset + at });
          out.push({ ...t, content: m[0], offset: t.offset + m.index, color: CLASS_CYAN });
          at = m.index + m[0].length;
        }
        if (at < t.content.length) out.push({ ...t, content: t.content.slice(at), offset: t.offset + at });
      }
      line.splice(0, line.length, ...out);
    }
  },
};

// One highlighter for the whole build; every code card awaits the same instance.
let highlighter: Promise<Highlighter> | undefined;

/** Code to Dracula-highlighted HTML at build time. The card paints the background. */
export async function highlight(code: string, lang: BundledLanguage): Promise<string> {
  highlighter ??= theme().then((t) => createHighlighter({ themes: [t], langs: LANGS }));
  return (await highlighter).codeToHtml(code.replace(/^\n+|\s+$/g, ""), {
    lang,
    theme: THEME,
    // Drop Shiki's own background so the card's token value wins.
    transformers: [...(lang === "python" ? [pythonClasses] : []), { pre(node) { delete node.properties.style; delete node.properties.tabindex; } }],
  });
}

export function CodeLights() {
  return <span className="code__lights" aria-hidden="true"><i /><i /><i /></span>;
}

/**
 * The only code block on the site: a dark Dracula card with window chrome and a
 * real filename in the tab. Highlighted at build time, so it ships as plain HTML.
 * It never adopts the page theme. Keep snippets short.
 */
export async function CodeSnap({ file, lang, children }: { file: string; lang: BundledLanguage; children: string }) {
  const html = await highlight(children, lang);
  return (
    <figure className="code">
      <figcaption className="code__bar">
        <CodeLights />
        <span className="code__tab code__tab--on">{file}</span>
      </figcaption>
      <div className="code__body" tabIndex={0} role="region" aria-label={file} dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}
