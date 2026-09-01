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
    '/*': ['./data/observed-building-inventory.json.gz'],
  },
};

export default nextConfig;
