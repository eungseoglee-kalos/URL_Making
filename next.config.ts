import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["naju.kbmtt.com"],
    },
  },
};

export default nextConfig;
