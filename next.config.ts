import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { hostname: "flagcdn.com" },
      { hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Silence Prisma warnings in Next.js; sdk-node-apis-efi needs native TLS (mTLS) — must not be bundled
  serverExternalPackages: ["@prisma/client", "bcryptjs", "nodemailer", "sdk-node-apis-efi"],
};

export default nextConfig;
