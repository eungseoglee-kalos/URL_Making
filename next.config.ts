import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["naju.kbmtt.com"],
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
