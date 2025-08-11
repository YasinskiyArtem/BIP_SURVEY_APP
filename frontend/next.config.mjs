/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone', // Критически важно для Docker
    reactStrictMode: true,
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'www.gravatar.com',
          pathname: '/avatar/**',
        },
      ],
    },
};

export default nextConfig;
