/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed Next.js i18n config to avoid conflicts with custom i18n setup
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization configuration
  images: {
    // Allow external domains if needed
    domains: [],
    // Enable image optimization
    unoptimized: false,
    // Allow SVG files
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Ensure static files are served correctly
  trailingSlash: false,
  
  // Asset prefix for production (if needed)
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/your-app-name' : '',
};

export default nextConfig;
