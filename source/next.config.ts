import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "1";
const forPages = process.env.GITHUB_PAGES === "1";
const pagesBase = "/a0001";

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const } : {}),
  ...(forPages
    ? {
        basePath: pagesBase,
        assetPrefix: pagesBase,
        env: {
          NEXT_PUBLIC_BASE_PATH: pagesBase,
        },
      }
    : {}),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
