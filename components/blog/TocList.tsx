import type { TocItem } from "@/lib/posts";
import { TocActive } from "./TocActive";

/** "On this page". Only for posts with three or more headings. */
export function TocList({ items, minutes }: { items: TocItem[]; minutes: number }) {
  return (
    <nav className="toc" aria-labelledby="toc-label">
      <div id="toc-label" className="toc__label">On this page</div>
      {items.map((it) => (
        <a key={it.id} href={`#${it.id}`} className="toc__link">{it.label}</a>
      ))}
      <p className="toc__note">{items.length} sections · {minutes} min</p>
      <TocActive ids={items.map((it) => it.id)} />
    </nav>
  );
}
