import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
