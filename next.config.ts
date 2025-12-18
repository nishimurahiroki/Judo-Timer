import type { NextConfig } from "next";

const repo = "Judo-Timer";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },

  // GitHub Pages対策（サブパス配下で正しく動かす）
  basePath: isProd ? `/${repo}` : undefined,
  assetPrefix: isProd ? `/${repo}/` : undefined,

  // 静的ホスティングで事故りにくくする
  trailingSlash: true,
};

export default nextConfig;
