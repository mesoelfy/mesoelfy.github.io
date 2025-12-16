/** @type {import('next').NextConfig} */

let commitHash = 'DEV_BUILD';

try {
  const { execSync } = require('child_process');
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  console.warn('Warning: Could not determine git commit hash.');
}

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // ENGINE OPTIMIZATION:
  // We disable Strict Mode because the Game Engine manages its own lifecycle.
  // Double-invoking mount/unmount in Dev causes AudioContext and WebGL context thrashing.
  reactStrictMode: false,
  transpilePackages: ['three'],
  
  // Disable Indicators
  devIndicators: false,

  env: {
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
