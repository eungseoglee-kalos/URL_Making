import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["naju.kbmtt.com"],
    },
  },
};

export default nextConfig;
