import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Allow external image hosts used by our seed data (avatars, placeholders)
  images: {
    domains: ["i.pravatar.cc", "placehold.co"],
    // If you prefer pattern matching instead, use `remotePatterns`.
  },
};

export default nextConfig;
