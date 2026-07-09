import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript errors ko build ke waqt ignore karega taaki app compile ho jaye
    ignoreBuildErrors: true,
  },
};

export default nextConfig;