import type { NextConfig } from "next";

console.log(
  "[BUILD DEBUG]",
  "ADMIN_EMAIL_len=" + (process.env.ADMIN_EMAIL?.length ?? -1),
  "RESEND_API_KEY_len=" + (process.env.RESEND_API_KEY?.length ?? -1),
  "NEXT_PUBLIC_SUPABASE_URL_len=" +
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.length ?? -1),
  "VERCEL_ENV=" + process.env.VERCEL_ENV,
  "keys=" +
    Object.keys(process.env)
      .filter((k) => k.includes("ADMIN") || k.includes("RESEND"))
      .join(","),
);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["naju.kbmtt.com"],
    },
  },
};

export default nextConfig;
