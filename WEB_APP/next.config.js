/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'St Regis Enrollment',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Online Course Enrollment System',
  },
};

module.exports = nextConfig;

