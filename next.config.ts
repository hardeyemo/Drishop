import type { NextConfig } from "next";

// Product images live in Supabase Storage (public bucket "product-images").
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  // This app lives beneath C:\Users\hp, which may contain another lockfile.
  // Keep Next's workspace and output tracing root anchored to this project.
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
