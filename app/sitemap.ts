import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://mikkaiser.com/", lastModified: new Date("2026-09-21"), changeFrequency: "monthly", priority: 1 }];
}
