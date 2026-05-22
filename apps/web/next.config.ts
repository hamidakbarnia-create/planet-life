import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow temporary Cloudflare quick-tunnel URLs to load the dev client/HMR.
  // Without this, Next dev rejects /_next/webpack-hmr as "Unauthorized".
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
