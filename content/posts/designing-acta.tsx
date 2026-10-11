import { CodeSnap } from "@/components/blog/CodeSnap";
import { A, Code, H2, Quote } from "@/components/blog/Prose";
import type { PostMeta, TocItem } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "designing-acta",
  title: "Designing a monochrome system for a personal site",
  summary: "How I built Acta, the design system behind this site, and the rules that kept it small.",
  lead: "Ten neutral tokens, one signal colour, and a code card that ignores the page theme.",
  topic: "Design",
  date: "2026-10-11",
  minutes: 4,
  draft: true,
};

export const toc: TocItem[] = [
  { id: "name", label: "Named after a Roman daily record" },
  { id: "colour", label: "Taking the colour out" },
  { id: "code", label: "Code keeps its own colours" },
  { id: "motion", label: "Motion without JavaScript" },
  { id: "missing", label: "What is still missing" },
];

export default function Post() {
  return (
    <>
      <p>
        I started the design system for this site on 15 September 2026 under the name Ledger. Three weeks later it was
        called Acta, its headings had moved from Poppins to Bricolage Grotesque to match the portfolio, and this blog
        became the first page built entirely from it. This post records the decisions that held.
      </p>

      <H2 id="name">Named after a Roman daily record</H2>
      <p>
        Acta is Latin for &ldquo;things done&rdquo;. Rome posted the <em>acta diurna</em>, a daily public record of what
        had actually happened, and that became the organising idea: every piece of content on the site is a dated record
        of work that shipped, set as a row in a register.
      </p>
      <p>
        It also became the voice rule. Copy is first person, past tense and specific, with numbers where numbers exist.
        A project row says what was built and with what. A post title states what the post is about, in sentence case,
        with no colon subtitle and no question.
      </p>
      <Quote>Show what was done, never what could be done.</Quote>

      <H2 id="colour">Taking the colour out</H2>
      <p>
        The palette is ten neutrals and one signal. Dark is the default: <Code>#0A0A0A</Code> for the page,{" "}
        <Code>#171717</Code> for a hovered row, <Code>#1F1F1F</Code> for anything disabled. Light mode inverts the same
        structure. The signal red has one job, form field errors, and appears nowhere else.
      </p>
      <p>
        With no hue to lean on, hierarchy had to come from weight, size and a single background step. That turned out to
        be a useful constraint. Every state also changes weight, fill or border, so none of them relies on colour
        perception alone, and every text pair clears WCAG AA in both themes. The faintest text, the 10px mono labels,
        sits at 6.1:1 on dark and 4.7:1 on light.
      </p>
      <p>
        There are two rule weights and nothing else: 1px of ink under a section head and 1px of a quieter grey between
        rows. There are no generic cards and no shadows. The one exception is code.
      </p>

      <H2 id="code">Code keeps its own colours</H2>
      <p>
        Code is the only place colour gets in. Every snippet sits in a dark card with window chrome and a real filename in
        the tab, set in JetBrains Mono 600 with ligatures and highlighted in Dracula. The card ignores the page theme, so
        a screenshot of a post reads the same wherever it lands. It is also the only element with a shadow, because it is
        meant to look like a foreign object sitting on the page.
      </p>
      <p>
        On this site the highlighting runs at build time, so each card ships as plain HTML and no highlighter is sent to
        the browser.
      </p>

      <H2 id="motion">Motion without JavaScript</H2>
      <p>
        All motion in Acta is scroll-driven CSS, and all of it is reversible. Nothing runs on a timer. The thin bar along
        the top of this page is the whole implementation:
      </p>
      <CodeSnap file="app/blog/blog.css" lang="css">{`
@supports (animation-timeline: scroll()) {
  @keyframes blog-progress {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  .progress {
    position: fixed; top: 0; left: 0; width: 100%; height: 2px;
    background: var(--ink); transform-origin: 0 50%;
    animation: blog-progress 1s linear both;
    animation-timeline: scroll(root);
  }
}`}</CodeSnap>
      <p>
        The one-second duration is a formality. <Code>animation-timeline: scroll(root)</Code> replaces the clock with
        the page&rsquo;s scroll position. Browsers without scroll timelines skip the block and show no bar, and under
        reduced motion it is switched off.
      </p>
      <p>
        Smooth scrolling uses the native <Code>scroll-behavior</Code> property instead of a JavaScript momentum library,
        because a library that transforms a wrapper element breaks scroll and view timelines.
      </p>

      <H2 id="missing">What is still missing</H2>
      <p>
        Acta has no logo. Where a mark would go, the name is set in Bricolage Grotesque 700, with a circular photo at
        small sizes. I have not missed it yet.
      </p>
      <p>
        The package still loads its fonts from Google Fonts, while this site serves the same families itself through
        next/font. The tokens, the eleven components and the rules are public in the{" "}
        <A href="https://mikkaiser.github.io/acta-design-system/">Acta documentation</A>.
      </p>
    </>
  );
}
