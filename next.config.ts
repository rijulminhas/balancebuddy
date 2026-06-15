import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactCompiler: true, // Disabled: causes Turbopack panic

  allowedDevOrigins: ["192.168.137.1", "*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.io"],

  serverExternalPackages: ["postgres", "bcryptjs"],

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Service worker must never be cached so Chrome always picks up updates
      // and the install-prompt criteria check sees the latest version.
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // Manifest must also never be served stale — Chrome caches it aggressively.
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/api/users/*/avatar" },
    ],
  },
};

export default nextConfig;
