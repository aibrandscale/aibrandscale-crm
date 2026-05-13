/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // When mounted under a parent domain (live.aibrandscale.io) via Next.js
  // multi-zone rewrites, assetPrefix makes the HTML reference _next/* assets
  // at the CRM's own Vercel origin so they bypass the rewrite layer.
  assetPrefix: process.env.NEXT_PUBLIC_CRM_URL || undefined,
};
export default nextConfig;
