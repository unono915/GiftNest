import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-mode build indicator overlaps this app's fixed bottom action
  // bars (gifticon detail, mobile "+" FAB) since both sit bottom-left/right.
  devIndicators: false,
};

export default nextConfig;
