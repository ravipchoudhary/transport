/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/assets/:path*',
        destination: '/api/assets/:path*'
      }
    ];
  }
};
module.exports = nextConfig;
