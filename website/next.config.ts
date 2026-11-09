import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Lets phones on the home network use the dev server (e.g. http://192.168.1.105:3000).
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
