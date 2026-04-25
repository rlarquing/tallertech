import type { NextConfig } from "next";
import path from "path";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^\/api\/dashboard?.*$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "dashboard-api",
        expiration: { maxEntries: 1, maxAgeSeconds: 60 * 5 }, // 5 min
      },
    },
    {
      urlPattern: /^\/api\/(products|customers|categories|suppliers|sales|repairs|expenses)\??.*$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "data-api",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 10 }, // 10 min
      },
    },
    {
      urlPattern: /^\/api\/(workshops|bi)\??.*$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "workshop-api",
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 5 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-images",
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 }, // 24 hours
      },
    },
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts",
        expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
      },
    },
  ],
});

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default withPWA(nextConfig);
