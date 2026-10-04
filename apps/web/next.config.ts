import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mca/ui", "@mca/core", "@mca/validators", "@mca/db"],
  serverExternalPackages: ["postgres"],
  typedRoutes: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }] },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      ],
    },
  ],
};

export default nextConfig;
