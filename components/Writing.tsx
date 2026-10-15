import Link from "next/link";
import { PostCard } from "@/components/blog/PostCard";
import { PostRow } from "@/components/blog/PostRow";
import { getPosts } from "@/lib/posts";

/** The home page's window into the blog: the newest post as a poster, the next few as rows. */
export function Writing() {
  const [latest, ...older] = getPosts();
  if (!latest) return null;
  const rows = older.slice(0, 3);
  const count = getPosts().length;

  return (
    <section id="writing" className="section section--lazy" aria-labelledby="writing-h">
      <div className="section-head" data-anim>
        <h2 id="writing-h">Writing</h2>
        <Link href="/blog" className="eyebrow navlink">{count === 1 ? "All posts" : `All ${count} posts`}</Link>
      </div>
      <div className="writing">
        <div className="writing__poster" data-anim>
          <PostCard post={latest.meta} />
        </div>
        <div className="writing__side" data-anim>
          <div className="writing__top">
            <p className="lead writing__intro">
              Notes on what I built, how it went, and what I would do again. Plain words, real code.
            </p>
            {rows.length ? (
              <ol className="prows">
                {rows.map((p) => (
                  <li key={p.meta.slug}><PostRow post={p.meta} /></li>
                ))}
              </ol>
            ) : null}
          </div>
          <Link href="/blog" className="btn btn--ghost writing__all">Read the blog</Link>
        </div>
      </div>
    </section>
  );
}
