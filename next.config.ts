import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow Turbopack with no custom config (PWA uses manual SW, not webpack plugin)
  turbopack: {},
};

export default nextConfig;
