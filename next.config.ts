import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Enables app/global-not-found.tsx. Needed because this app has no single
    // composable root layout: `[locale]/layout.tsx` and `admin/layout.tsx` each
    // render their own <html>/<body>, and the top-level layout is a
    // pass-through. Without this, a URL matching neither tree (e.g. /en/admin)
    // renders the built-in 404 inside that pass-through and throws
    // "Missing <html> and <body> tags in the root layout".
    globalNotFound: true,
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
    qualities: [75, 85],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default withNextIntl(nextConfig);
