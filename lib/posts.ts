import type { ComponentType } from "react";
import * as aiAgents from "@/content/posts/ai-agents-from-llm-calls-to-loops";

export type PostMeta = {
  slug: string;
  title: string;
  /** One sentence for the index row, the meta description and the feed. */
  summary: string;
  /** One sentence under the title on the post page. Falls back to the summary. */
  lead?: string;
  /** The post's single topic; also its filter tag on the index. */
  topic: string;
  /** Publication date, YYYY-MM-DD. */
  date: string;
  /** Reading time in minutes, set by hand. */
  minutes: number;
  /** Drafts render in `next dev` only. */
  draft?: boolean;
};

/** The RSS link for every blog page. Metadata merges shallowly, so pages that set alternates repeat it. */
export const FEED_ALTERNATE = { "application/rss+xml": [{ url: "/blog/feed.xml", title: "Mikkaiser, writing" }] };

export type TocItem = { id: string; label: string };

export type Post = { meta: PostMeta; toc: TocItem[]; Body: ComponentType };

type PostModule = { meta: PostMeta; toc?: TocItem[]; default: ComponentType };

// Every post is a TSX module in content/posts. Register it here to publish it.
const MODULES: PostModule[] = [aiAgents];

const SHOW_DRAFTS = process.env.NODE_ENV !== "production";

const ALL: Post[] = MODULES.map((m) => ({ meta: m.meta, toc: m.toc ?? [], Body: m.default }))
  .filter((p) => SHOW_DRAFTS || !p.meta.draft)
  .sort((a, b) => b.meta.date.localeCompare(a.meta.date));

/** Published posts, newest first. */
export function getPosts(): Post[] {
  return ALL;
}

export function getPost(slug: string): Post | undefined {
  return ALL.find((p) => p.meta.slug === slug);
}

/** The next older post, or the newest one when this is the oldest. */
export function getNextPost(slug: string): Post | undefined {
  const i = ALL.findIndex((p) => p.meta.slug === slug);
  if (i < 0 || ALL.length < 2) return undefined;
  return ALL[(i + 1) % ALL.length];
}

export function getTopics(): string[] {
  return [...new Set(ALL.map((p) => p.meta.topic))].sort();
}

export function topicKey(topic: string): string {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

/** 2026-10-11 → 10·26, the date gutter on index rows. */
export function formatShortDate(date: string): string {
  const { y, m } = parts(date);
  return `${String(m).padStart(2, "0")}·${String(y).slice(2)}`;
}

/** 2026-10-11 → 11 October 2026. */
export function formatLongDate(date: string): string {
  const { y, m, d } = parts(date);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
