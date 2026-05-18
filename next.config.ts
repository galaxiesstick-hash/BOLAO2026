import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { hostname: "flagcdn.com" },
      { hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Silence Prisma warnings in Next.js
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
