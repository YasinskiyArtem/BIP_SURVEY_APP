/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: 'out',    // Папка для экспортированных файлов
    reactStrictMode: true,
    images: {

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/**',
      },
    ],
    unoptimized: true // Для статического экспорта
   }
};


module.exports = nextConfig; // Выносим наружу
