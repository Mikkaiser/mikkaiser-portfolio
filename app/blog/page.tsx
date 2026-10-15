import type { Metadata } from "next";
import { PostCard } from "@/components/blog/PostCard";
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
    <>
      <header className="blog-hero">
        <div className="wrap">
          {posts.length ? <p className="post__meta">{span ? `${count} · ${span}` : count}</p> : null}
          <h1 className="blog-hero__title">Writing</h1>
          <p className="blog-hero__intro">Notes on what I built, how it held up, and what I would do again. Plain words, real code.</p>
        </div>
      </header>

      <section className="section section--last blog-index" aria-label="Posts">
        {posts.length === 0 ? (
          <p className="small">The first post is on its way.</p>
        ) : (
          <>
            {topics.length > 1 ? <TopicFilter topics={topics} /> : null}
            <ol className="postcards">
              {posts.map((p) => (
                <li key={p.meta.slug} data-topic={topicKey(p.meta.topic)}>
                  <PostCard post={p.meta} />
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </>
  );
}
