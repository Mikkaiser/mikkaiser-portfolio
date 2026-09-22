import type { NextConfig } from "next";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

const nextConfig: NextConfig = {
  experimental: {
    // Inline the (small) global stylesheet into the HTML: one fewer render-blocking request.
    inlineCss: true,
  },
  images: {
    // Optimised images are keyed by URL, so let browsers keep them for a month.
    minimumCacheTTL: THIRTY_DAYS,
    // 90 is used for the hero portrait, which is cropped hard and sits above the fold.
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        // Photos, logos and the CV under public/assets: same 30-day browser cache.
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: `public, max-age=${THIRTY_DAYS}, stale-while-revalidate=86400` }],
      },
    ];
  },
};

export default nextConfig;
