/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['placeholder.com'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', 'framer-motion', 'lucide-react'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;

