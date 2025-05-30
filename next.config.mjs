/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack(config, { dev, isServer }) {
    if (dev && !isServer) {
      // Enable source maps for client-side development
      config.devtool = 'source-map';
    }
    return config;
  },
};

export default nextConfig;
