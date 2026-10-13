import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeLangSync } from "@/components/blog/CodeLangSync";
import { PlainHint } from "@/components/blog/PlainHint";
import { TocList } from "@/components/blog/TocList";
import { FEED_ALTERNATE, formatLongDate, getNextPost, getPost, getPosts } from "@/lib/posts";

const SITE = "https://mikkaiser.com";

// Every post is known at build time; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.meta.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const { title, summary, date, cover } = post.meta;
  const images = cover ? [{ url: cover.src, width: cover.width, height: cover.height, alt: cover.alt }] : undefined;
  return {
    title: `${title} | Mikkaiser`,
    description: summary,
    alternates: { canonical: `/blog/${slug}`, types: FEED_ALTERNATE },
    openGraph: {
      type: "article",
      url: `/blog/${slug}`,
      title,
      description: summary,
      publishedTime: date,
      authors: ["Mikael Ribeiro Simoes"],
      images,
    },
    twitter: { title, description: summary, images },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const { meta, toc, Body } = post;
  const next = getNextPost(slug);
  const showToc = toc.length >= 3;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.summary,
    datePublished: meta.date,
    ...(meta.cover ? { image: `${SITE}${meta.cover.src}` } : {}),
    url: `${SITE}/blog/${slug}`,
    mainEntityOfPage: `${SITE}/blog/${slug}`,
    inLanguage: "en-GB",
    author: { "@type": "Person", name: "Mikael Ribeiro Simoes", url: `${SITE}/` },
  };

  const metaLine = (
    <p className="post__meta">
      <time dateTime={meta.date}>{formatLongDate(meta.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{meta.minutes} min</span>
      <span aria-hidden="true">·</span>
      <span>{meta.topic}</span>
    </p>
  );
  const title = <h1 className="post__title">{meta.title}</h1>;

  return (
    <article className={meta.cover ? "post post--cover" : "post"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="progress" data-progress aria-hidden="true" />
      <CodeLangSync />
      <PlainHint />
      {meta.cover ? (
        <header className="cover">
          <Image
            className="cover__img"
            src={meta.cover.src}
            alt={meta.cover.alt}
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
          />
          <div className="wrap cover__text">
            {metaLine}
            {title}
          </div>
        </header>
      ) : null}
      <div className="wrap">
        <div className={showToc ? "post__grid" : "post__grid post__grid--solo"}>
          <header className="post__head">
            {meta.cover ? null : <>{metaLine}{title}</>}
            <p className="post__lead">{meta.lead ?? meta.summary}</p>
          </header>
          {showToc ? <aside className="post__toc"><TocList items={toc} minutes={meta.minutes} /></aside> : null}
          <div className="post__body">
            <div className="prose"><Body /></div>
            <footer className="post__end">
              {next ? <Link href={`/blog/${next.meta.slug}`} className="btn btn--primary" aria-label={`Read next: ${next.meta.title}`}>Read next</Link> : null}
              <Link href="/blog" className="btn btn--ghost">All posts</Link>
            </footer>
          </div>
        </div>
      </div>
    </article>
  );
}
