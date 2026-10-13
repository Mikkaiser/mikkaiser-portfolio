import Link from "next/link";
import { ParticleCover } from "@/components/blog/cover/ParticleCover";
import { formatShortDate, type PostMeta } from "@/lib/posts";

/** One post as a row in the register: date gutter, cover thumbnail, title and kicker, summary, reading time. */
export function EntryRow({ post, kicker = true }: { post: PostMeta; kicker?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="entry">
      <time className="entry__date" dateTime={post.date}>{formatShortDate(post.date)}</time>
      {post.cover ? (
        <span className="entry__thumb"><ParticleCover shape={post.cover} kind="thumb" /></span>
      ) : null}
      <span className="entry__main">
        <span className="entry__head">
          <span className="entry__title">{post.title}</span>
          {kicker ? <span className="entry__kicker">{post.topic}</span> : null}
        </span>
        <span className="entry__summary">{post.summary}</span>
      </span>
      <span className="entry__dur">{post.minutes} min</span>
    </Link>
  );
}
