import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { drift, field, glow, STILL_HEAD } from "@/components/blog/cover/field";
import { getPost, getPosts } from "@/lib/posts";

// The share image: a still frame of the post's particle cover, with the title.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The post title over its particle cover";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.meta.slug }));
}

// Static instances of the site fonts (both SIL Open Font License); the share image cannot use next/font.
const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/BricolageGrotesque-ExtraBold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/JetBrainsMono-Regular.ttf")),
]);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const [display, mono] = await fonts;
  const { width: w, height: h } = size;
  const f = post?.meta.cover ? field(post.meta.cover, "share", w, h) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0A0A0A" }}>
        {f ? (
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", top: 0, left: 0 }}>
            {f.motes.map((m, i) => {
              const p = drift(m, w, h, 0);
              return <circle key={`m${i}`} cx={p.x} cy={p.y} r={m.size / 2} fill="#FFFFFF" fillOpacity={m.tone} />;
            })}
            {f.seeds.map((s, i) => {
              const p = f.at(s.u, s.off);
              const a = Math.min(1, s.tone + glow(s.u, STILL_HEAD) * 0.6);
              return <circle key={i} cx={p.x} cy={p.y} r={s.size / 2} fill="#FFFFFF" fillOpacity={a} />;
            })}
          </svg>
        ) : null}
        <div style={{ position: "absolute", left: 72, bottom: 64, right: 72, display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, letterSpacing: "0.08em", color: "#8F8F8F", marginBottom: 20 }}>
            {`MIKKAISER · ${post?.meta.topic.toUpperCase() ?? "BLOG"}`}
          </div>
          <div style={{ fontFamily: "Bricolage Grotesque", fontSize: 72, lineHeight: 1.04, letterSpacing: "-0.04em", color: "#FFFFFF", maxWidth: 640 }}>
            {post?.meta.title ?? "Mikkaiser"}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage Grotesque", data: display, style: "normal", weight: 800 },
        { name: "JetBrains Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}
