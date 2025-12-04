/** @type {import('next').NextConfig} */

let commitHash = 'DEV_BUILD';

try {
  const { execSync } = require('child_process');
  // Get the short hash (e.g., a1b2c3d)
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  console.warn('Warning: Could not determine git commit hash.');
}

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  transpilePackages: ['three'],
  
  // Disable the Dev Tool Indicators (Bottom Left)
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  
  // Inject the hash into the app
  env: {
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
  },
  
  // IGNORE BUILD ERRORS (The "Just Ship It" Settings)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
