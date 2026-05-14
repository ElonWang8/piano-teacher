import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // SQLite Prisma 需要在构建时复制
  serverExternalPackages: [],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
