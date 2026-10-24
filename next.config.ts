import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Most pages read the session; plain dynamic rendering keeps that simple.
  cacheComponents: false,
  experimental: {
    // The persistent cache misses CSS edits on this FUSE-mounted drive and serves stale styles.
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    // Packages live on the local disk (see pnpm-workspace.yaml), outside the project folder.
    root: "/",
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
