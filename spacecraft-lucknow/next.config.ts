import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Development only: lets the site load fully when previewed through a
  // temporary Cloudflare tunnel link (used to share the local preview).
  allowedDevOrigins: ["*.trycloudflare.com"],
  turbopack: {
    // Keep this app self-contained (it lives inside a folder with another project).
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
