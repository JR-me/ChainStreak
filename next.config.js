/** @type {import('next').NextConfig} */

/**
 * HOW BUILDS WORK
 * ───────────────
 * Netlify:       npm run build         → serves from /
 * GitHub Pages:  npm run build:github  → serves from /chainstreak/
 *
 * basePath is read by Next.js at BUILD time from this file.
 * Do NOT try to pass it as a runtime env var — it won't work.
 *
 * If your GitHub repo is not named "chainstreak":
 *   Change GITHUB_REPO_NAME below — that's the only place you need to edit.
 */

const GITHUB_REPO_NAME = "chainstreak"; // ← change if your repo name differs

const isGithubPages = process.env.BUILD_TARGET === "github";
const basePath      = isGithubPages ? `/${GITHUB_REPO_NAME}` : "";

const nextConfig = {
  output: "export",       // Pure static HTML/JS — no server needed
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,    // Generates /page/index.html — required for static hosts
  images: {
    unoptimized: true,    // next/image optimisation requires a server
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
