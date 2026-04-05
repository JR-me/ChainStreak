/** @type {import('next').NextConfig} */

// GitHub Pages serves from /repo-name/ — set this to your repo name.
// On Netlify it serves from /, so NEXT_PUBLIC_BASE_PATH is left empty.
// Build for GitHub Pages:  NEXT_PUBLIC_BASE_PATH=/chainstreak npm run build
// Build for Netlify:       npm run build  (no env var needed)

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig = {
  output: "export",          // Static HTML export — no Node server needed
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,       // Required for static hosting (index.html in each folder)
  images: {
    unoptimized: true,       // next/image optimisation requires a server; disable for static
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
