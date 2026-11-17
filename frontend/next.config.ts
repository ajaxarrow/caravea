import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Internal staff tool: keep every response out of search engines. A header
  // rather than a <meta> tag, because streamed pages (including not-found
  // ones, which keep a 200 status) only get their metadata after <head>.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
