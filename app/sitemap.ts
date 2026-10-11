import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const blog: MetadataRoute.Sitemap = posts.length
    ? [
        { url: "https://mikkaiser.com/blog", lastModified: new Date(posts[0].meta.date), changeFrequency: "weekly", priority: 0.8 },
        ...posts.map((p) => ({
          url: `https://mikkaiser.com/blog/${p.meta.slug}`,
          lastModified: new Date(p.meta.date),
          changeFrequency: "yearly" as const,
          priority: 0.6,
        })),
      ]
    : [];
  return [{ url: "https://mikkaiser.com/", lastModified: new Date("2026-09-21"), changeFrequency: "monthly", priority: 1 }, ...blog];
}
