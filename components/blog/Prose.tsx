import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

/* The building blocks a post is written with. Styles live in app/blog/blog.css under .prose. */

/** A section heading. Give it the same id as its entry in the post's toc. */
export function H2({ id, children }: { id: string; children: ReactNode }) {
  return <h2 id={id}>{children}</h2>;
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
  return <h3 id={id}>{children}</h3>;
}

/** Inline code: a small Dracula chip, the same in both themes. */
export function Code({ children }: { children: ReactNode }) {
  return <code className="icode">{children}</code>;
}

/** A link in running text. External links open in a new tab and carry ↗. */
export function A({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:\/\//.test(href);
  return external ? (
    <a href={href} target="_blank" rel="noopener">{children} ↗</a>
  ) : (
    <a href={href}>{children}</a>
  );
}

/** A pull quote: one sentence in ink behind a 2px rule. */
export function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote>
      <p>{children}</p>
    </blockquote>
  );
}

/** Evidence photography: full colour, framed, always captioned. */
export function Figure({ src, alt, caption, width, height }: {
  src: string | StaticImageData;
  alt: string;
  caption: ReactNode;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="figure">
      <div className="figure__frame">
        <Image src={src} alt={alt} width={width} height={height} sizes="(max-width: 720px) 100vw, 64ch" />
      </div>
      <figcaption className="figure__cap">{caption}</figcaption>
    </figure>
  );
}
