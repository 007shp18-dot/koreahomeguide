import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const nextConfig: NextConfig = {
  trailingSlash: true,
  experimental: {
    globalNotFound: true,
  },
  turbopack: {
    root: repositoryRoot,
  },
  outputFileTracingRoot: repositoryRoot,
  outputFileTracingIncludes: {
    '/*': [
      './data/observed-building-inventory.json.gz',
      './data/korea-rent-evidence.json.gz',
      './data/korea-sale-evidence.json.gz',
      './data/korea-conversion-evidence.json.gz',
    ],
  },
};

export default nextConfig;
