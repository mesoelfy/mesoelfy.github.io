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
  reactStrictMode: false,
  transpilePackages: ['three'],
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
