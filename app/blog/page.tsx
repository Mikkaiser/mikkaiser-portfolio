import type { Metadata } from "next";
import { EntryRow } from "@/components/blog/EntryRow";
import { TopicFilter } from "@/components/blog/TopicFilter";
import { FEED_ALTERNATE, getPosts, getTopics, topicKey } from "@/lib/posts";

const DESCRIPTION = "Writing by Mikael Ribeiro Simoes on software engineering, architecture and teaching, from Abu Dhabi.";

export const metadata: Metadata = {
  title: "Blog | Mikkaiser",
  description: DESCRIPTION,
  alternates: { canonical: "/blog", types: FEED_ALTERNATE },
  openGraph: { type: "website", url: "/blog", title: "Blog | Mikkaiser", description: DESCRIPTION },
};

export default function BlogIndex() {
  const posts = getPosts();
  const topics = getTopics();
  const years = [...new Set(posts.map((p) => p.meta.date.slice(0, 4)))].sort();
  const span = years.length > 1 ? `${years[0]}–${years.at(-1)}` : years[0];
  const count = `${posts.length} ${posts.length === 1 ? "post" : "posts"}`;

  return (
    <section className="section section--last blog-index" aria-labelledby="blog-title">
      <div className="section-head">
        <h1 id="blog-title">Writing</h1>
        {posts.length ? <span className="eyebrow">{span ? `${count} · ${span}` : count}</span> : null}
      </div>
      <p className="body blog-index__intro">
        Notes on what I built, how it held up, and what I would do again.
      </p>
      {posts.length === 0 ? (
        <p className="small">The first post is on its way.</p>
      ) : (
        <>
          {topics.length > 1 ? <TopicFilter topics={topics} /> : null}
          <ol className="entries">
            {posts.map((p) => (
              <li key={p.meta.slug} data-topic={topicKey(p.meta.topic)}>
                <EntryRow post={p.meta} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
