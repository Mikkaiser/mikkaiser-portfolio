import { bundledThemes, createHighlighter, type BundledLanguage, type Highlighter, type ThemeRegistration } from "shiki";

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

// One highlighter for the whole build; every code card awaits the same instance.
let highlighter: Promise<Highlighter> | undefined;

/** Code to Dracula-highlighted HTML at build time. The card paints the background. */
export async function highlight(code: string, lang: BundledLanguage): Promise<string> {
  highlighter ??= theme().then((t) => createHighlighter({ themes: [t], langs: LANGS }));
  return (await highlighter).codeToHtml(code.replace(/^\n+|\s+$/g, ""), {
    lang,
    theme: THEME,
    // Drop Shiki's own background so the card's token value wins.
    transformers: [{ pre(node) { delete node.properties.style; delete node.properties.tabindex; } }],
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
