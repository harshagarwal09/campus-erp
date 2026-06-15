/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required to allow mysql2 (Node.js runtime) in API routes
  experimental: {
    serverComponentsExternalPackages: ['mysql2', 'bcrypt'],
  },
};

module.exports = nextConfig;
