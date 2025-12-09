/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'southpeakscc.co.uk',
      },
    ],
  },
};

module.exports = nextConfig;

