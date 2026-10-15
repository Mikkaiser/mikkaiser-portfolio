import Link from "next/link";
import { ParticleCover } from "@/components/blog/cover/ParticleCover";
import { formatLongDate, type PostMeta } from "@/lib/posts";
import "./postlist.css";

/** One post on the index: a portrait poster of its cover with the date line and title over its foot, and the summary under it. */
export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="postcard">
      <span className="postcard__poster">
        {post.cover ? <ParticleCover shape={post.cover} kind="card" /> : null}
        <span className="postcard__text">
          <span className="postcard__meta">
            <time dateTime={post.date}>{formatLongDate(post.date)}</time> · {post.minutes} min · {post.topic}
          </span>
          <span className="postcard__title">{post.title}</span>
        </span>
      </span>
      <span className="postcard__summary">{post.summary}</span>
    </Link>
  );
}
