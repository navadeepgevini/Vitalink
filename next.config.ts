import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint warnings/errors won't fail the build.
    // We still run ESLint as a dev-time check.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
