import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/cms/:path*',
        destination: 'http://localhost:8080/cms/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
};

export default nextConfig;
