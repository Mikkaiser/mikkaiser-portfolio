import { createHighlighter, type BundledLanguage, type Highlighter } from "shiki";

const LANGS: BundledLanguage[] = ["ts", "tsx", "js", "jsx", "css", "html", "json", "bash", "csharp", "sql", "yaml"];

// One highlighter for the whole build; every CodeSnap awaits the same instance.
let highlighter: Promise<Highlighter> | undefined;
function getHighlighter() {
  highlighter ??= createHighlighter({ themes: ["dracula"], langs: LANGS });
  return highlighter;
}

/**
 * The only code block on the site: a dark Dracula card with window chrome and a
 * real filename in the tab. Highlighted at build time, so it ships as plain HTML.
 * It never adopts the page theme. Keep snippets to twelve lines.
 */
export async function CodeSnap({ file, lang, children }: { file: string; lang: BundledLanguage; children: string }) {
  const html = (await getHighlighter()).codeToHtml(children.replace(/^\n+|\s+$/g, ""), {
    lang,
    theme: "dracula",
    // The card paints the background; drop Shiki's own so the token value wins.
    transformers: [{ pre(node) { delete node.properties.style; delete node.properties.tabindex; } }],
  });
  return (
    <figure className="code">
      <figcaption className="code__bar">
        <span className="code__lights" aria-hidden="true"><i /><i /><i /></span>
        <span className="code__tab">{file}</span>
      </figcaption>
      <div className="code__body" tabIndex={0} role="region" aria-label={file} dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}
