import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },

  // ─── Image Optimization ────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },

  // ─── Compression ──────────────────────────────────────────────────────────
  compress: true,
  productionBrowserSourceMaps: false,

  // ─── Build Optimization ───────────────────────────────────────────────────
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
