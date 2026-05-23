import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/notebook",
        destination: "/learning",
        permanent: true,
      },
      {
        source: "/notebook/:slug",
        destination: "/learning/lesson/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
