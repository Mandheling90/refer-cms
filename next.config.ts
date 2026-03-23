import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: process.env.API_URL || 'http://api-service:8000/graphql',
      },
    ];
  },
};

export default nextConfig;
