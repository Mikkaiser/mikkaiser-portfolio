import Link from "next/link";
import { formatShortDate, type PostMeta } from "@/lib/posts";
import "./postlist.css";

/** One post as an Acta entry row: date gutter, title and summary, read time. The whole row is the link. */
export function PostRow({ post }: { post: PostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="prow">
      <time className="prow__when" dateTime={post.date}>{formatShortDate(post.date)}</time>
      <span className="prow__body">
        <span className="prow__title">{post.title}</span>
        <span className="prow__summary">{post.summary}</span>
      </span>
      <span className="prow__meta">
        <span>{post.minutes} min</span>
        <span>{post.topic}</span>
      </span>
    </Link>
  );
}
