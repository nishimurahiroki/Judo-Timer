import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow external access for development
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "192.168.123.135:3000"],
    },
  },
};

export default nextConfig;
