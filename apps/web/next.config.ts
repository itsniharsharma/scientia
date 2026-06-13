import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@scientia/shared', '@scientia/config'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;
