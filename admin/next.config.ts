import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Allow external image hosts used by our seed data (avatars, placeholders)
  images: {
    domains: ["i.pravatar.cc", "placehold.co", "res.cloudinary.com"],
    unoptimized: true,
  },
  output: "export",
};

export default nextConfig;
