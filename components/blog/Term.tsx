import { Popover } from "@/components/Popover";

/**
 * A niche word in a post, with a short explanation that opens on hover, focus
 * or tap: the same reference popover the home page uses. Keep the explanation
 * to two or three plain sentences; `href` adds a "Read more" link.
 */
export function Term({ id, title, href, children, label }: {
  id: string;
  /** The word as it appears in the sentence. */
  label: string;
  /** The heading inside the panel, when it differs from the label. */
  title?: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Popover id={`term-${id}`} label={label} wrapClass="termwrap" triggerClass="term" panelClass="cref">
      <span className="ref__p">
        <strong className="ref__title">{title ?? label}</strong> {children}
      </span>
      {href ? <a className="ref__link" href={href} target="_blank" rel="noreferrer">Read more ↗</a> : null}
    </Popover>
  );
}
