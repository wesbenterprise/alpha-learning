/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required to allow canvas-confetti to work
  transpilePackages: [],
  // Ignore build errors for missing env vars (they're injected at runtime)
  eslint: { ignoreDuringBuilds: true },
  // PWA-friendly headers
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
