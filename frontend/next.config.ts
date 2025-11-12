import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['tsx','ts','jsx','js'],
  experimental: { typedRoutes: true }
};

export default nextConfig;
