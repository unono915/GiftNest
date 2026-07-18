import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-mode build indicator overlaps this app's fixed bottom action
  // bars (gifticon detail, mobile "+" FAB) since both sit bottom-left/right.
  devIndicators: false,
  // firebase-admin/auth pulls in jwks-rsa -> jose, whose ESM build breaks
  // when Turbopack bundles it into the serverless function output
  // (ERR_REQUIRE_ESM at runtime on Vercel). Marking firebase-admin external
  // makes Node `require()` it directly from node_modules instead, which
  // resolves the CJS/ESM interop correctly.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
