import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Petpooja daily CSVs run ~1.5–2 MB. Default is 1 MB.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
