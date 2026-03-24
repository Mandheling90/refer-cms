import type { NextConfig } from 'next';
const API_BACKEND = process.env.API_URL || 'http://api-service:8000'

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BACKEND}/:path*`,
      },
      {
        source: '/upload',
        destination: `${API_BACKEND}/upload`,
      },
    ]
  },
};

export default nextConfig;
