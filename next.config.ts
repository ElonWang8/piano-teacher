import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // SQLite Prisma 需要在构建时复制
  serverExternalPackages: [],
};

export default nextConfig;
