import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // 🔥 Desactivar typedRoutes completamente
  typedRoutes: false,

  experimental: {
    typedRoutes: false   // <--- esto era lo que te lo activaba antes
  }
};

export default nextConfig;
