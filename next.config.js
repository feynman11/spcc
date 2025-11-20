/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['southpeakscc.co.uk'],
  },
};

module.exports = nextConfig;

