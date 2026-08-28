import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Source maps are the build's biggest avoidable memory cost, and this app is
  // released by building ON the 2 GB production box — where the prerender phase
  // (five locales' worth of static pages) once exhausted RAM and swap and froze
  // the machine hard enough to need a power-cycle. Nothing consumes server
  // source maps here: errors are read through `journalctl`, against code that
  // is on disk beside the build. Defaults are `enablePrerenderSourceMaps: true`
  // and browser maps already off, so this line is what actually changes.
  // See node_modules/next/dist/docs/01-app/02-guides/memory-usage.md.
  enablePrerenderSourceMaps: false,

  experimental: {
    // Enables app/global-not-found.tsx. Needed because this app has no single
    // composable root layout: `[locale]/layout.tsx` and `admin/layout.tsx` each
    // render their own <html>/<body>, and the top-level layout is a
    // pass-through. Without this, a URL matching neither tree (e.g. /en/admin)
    // renders the built-in 404 inside that pass-through and throws
    // "Missing <html> and <body> tags in the root layout".
    globalNotFound: true,

    // Same reason as `enablePrerenderSourceMaps` above.
    serverSourceMaps: false,
  },

  async redirects() {
    return [
      // The admin is not localized, but /ru/admin is the natural thing to type
      // after browsing the site. Send those to the real admin instead of a 404.
      {
        source: "/:locale(ru|en|tk|uz|az)/admin",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/:locale(ru|en|tk|uz|az)/admin/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    // Cap the largest generated variant at 1920. The default ceiling is
    // 3840, so a full-bleed `sizes="100vw"` background fetched the 3840
    // variant on a 2x display — several times the bytes needed for photos
    // and blurred backdrops. 1920 covers virtually every screen and upscales
    // imperceptibly on the rare 4K one.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default withNextIntl(nextConfig);
