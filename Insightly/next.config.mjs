/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer is ESM-only — must be transpiled by Next.js
  transpilePackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile images
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
