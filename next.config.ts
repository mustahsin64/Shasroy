import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Admin photo uploads (validated to 4 MB in src/lib/admin/products.ts; Vercel caps request bodies at 4.5 MB).
    serverActions: { bodySizeLimit: "4.4mb" },
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: "https",
            hostname: supabaseUrl.hostname,
            pathname: "/storage/v1/object/public/product-images/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
