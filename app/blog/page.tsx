import type { Metadata } from "next";
import Link from "next/link";
import { ParticleCover } from "@/components/blog/cover/ParticleCover";
import { PostRow } from "@/components/blog/PostRow";
import { TopicFilter } from "@/components/blog/TopicFilter";
import { FEED_ALTERNATE, formatLongDate, getPosts, getTopics, topicKey } from "@/lib/posts";

const DESCRIPTION = "Writing by Mikael Ribeiro Simoes on software engineering, architecture and teaching, from Abu Dhabi.";

export const metadata: Metadata = {
  title: "Blog | Mikkaiser",
  description: DESCRIPTION,
  alternates: { canonical: "/blog", types: FEED_ALTERNATE },
  openGraph: { type: "website", url: "/blog", title: "Blog | Mikkaiser", description: DESCRIPTION },
};

export default function BlogIndex() {
  const [latest, ...older] = getPosts();
  const topics = getTopics();
  const total = older.length + (latest ? 1 : 0);
  const years = [...new Set(getPosts().map((p) => p.meta.date.slice(0, 4)))].sort();
  const span = years.length > 1 ? `${years[0]}–${years.at(-1)}` : years[0];

  return (
    <>
      <div className="wrap blog-head">
        <h1 className="blog-head__title">Writing</h1>
        <p className="blog-head__intro">Notes on what I built, how it held up, and what I would do again. Plain words, real code.</p>
      </div>

      {latest ? (
        <section className="cover cover--index" aria-labelledby="latest-title">
          {latest.meta.cover ? <ParticleCover shape={latest.meta.cover} kind="cover" /> : null}
          <div className="wrap cover__text">
            <p className="post__meta">
              <span>Latest</span>
              <span aria-hidden="true">·</span>
              <time dateTime={latest.meta.date}>{formatLongDate(latest.meta.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{latest.meta.minutes} min</span>
              <span aria-hidden="true">·</span>
              <span>{latest.meta.topic}</span>
            </p>
            <h2 id="latest-title" className="post__title">
              <Link href={`/blog/${latest.meta.slug}`}>{latest.meta.title}</Link>
            </h2>
            <p className="post__lead">{latest.meta.summary}</p>
            <Link href={`/blog/${latest.meta.slug}`} className="btn btn--primary">Read the post</Link>
          </div>
        </section>
      ) : null}

      <section className="section section--last blog-index" aria-labelledby="more-title">
        <div className="section-head">
          <h2 id="more-title">{latest ? "More writing" : "Writing"}</h2>
          <span className="eyebrow">
            {total} {total === 1 ? "post" : "posts"}{span ? ` · ${span}` : ""} · <Link href="/blog/feed.xml">RSS</Link>
          </span>
        </div>
        {!latest ? (
          <p className="small">The first post is on its way.</p>
        ) : older.length === 0 ? (
          <p className="body blog-note">
            That is the only post so far. The next one is on its way, and the <Link href="/blog/feed.xml">RSS feed</Link> will
            tell you when it lands.
          </p>
        ) : (
          <>
            {topics.length > 1 ? <TopicFilter topics={topics} /> : null}
            <ol className="prows">
              {older.map((p) => (
                <li key={p.meta.slug} data-topic={topicKey(p.meta.topic)}>
                  <PostRow post={p.meta} />
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </>
  );
}
