import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'ckeditor5',
    '@ckeditor/ckeditor5-react',
    'grapesjs',
    '@grapesjs/react',
    'grapesjs-preset-webpage',
  ],
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
