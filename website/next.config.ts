import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/site-images/**`)]
      : [],
    // The local Supabase stack serves images from 127.0.0.1, which Next blocks by default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
  // Lets phones on the home network use the dev server (e.g. http://192.168.1.105:3000).
  allowedDevOrigins: ["192.168.*.*"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
