import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove "standalone" output for Vercel deployment
  // Vercel uses its own build system
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
