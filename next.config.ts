import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@auth0/nextjs-auth0", "ai", "@ai-sdk/groq"],
  },
  serverExternalPackages: ["@vercel/og", "@openfga/sdk", "auth0"],
  
};

export default nextConfig;
