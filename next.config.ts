import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/graphql',
        destination: 'http://158.247.215.161/graphql',
      },
    ];
  },
};

export default nextConfig;
