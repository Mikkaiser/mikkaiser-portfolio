import { getPosts } from "@/lib/posts";

const SITE = "https://mikkaiser.com";

// Built once at deploy time; the feed only changes when a post is added.
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const posts = getPosts();
  const items = posts
    .map(({ meta }) => {
      const url = `${SITE}/blog/${meta.slug}`;
      return `    <item>
      <title>${esc(meta.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(meta.summary)}</description>
      <category>${esc(meta.topic)}</category>
      <pubDate>${new Date(`${meta.date}T00:00:00Z`).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mikkaiser, writing</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>Writing by Mikael Ribeiro Simoes on software engineering, architecture and teaching.</description>
    <language>en-gb</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
