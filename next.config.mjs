/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'ar'],
    localeDetection: false,
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
