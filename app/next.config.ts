import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma runtime uses path/fs against process.cwd(); bundling it triggers Turbopack NFT "whole project traced" warnings.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
