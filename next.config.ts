import type { NextConfig } from 'next';
const API_BACKEND = process.env.API_URL || 'http://api-service:8000';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    proxyTimeout: 5 * 60 * 1000, // 5분
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BACKEND}/:path*`,
      },
    ];
  },
};

export default nextConfig;
