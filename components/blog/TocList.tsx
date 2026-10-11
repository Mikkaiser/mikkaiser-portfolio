import type { TocItem } from "@/lib/posts";
import { TocActive } from "./TocActive";

/** "On this page". Only for posts with three or more headings. */
export function TocList({ items }: { items: TocItem[] }) {
  return (
    <nav className="toc" aria-labelledby="toc-label">
      <div id="toc-label" className="toc__label">On this page</div>
      {items.map((it) => (
        <a key={it.id} href={`#${it.id}`} className="toc__link">{it.label}</a>
      ))}
      <TocActive ids={items.map((it) => it.id)} />
    </nav>
  );
}
