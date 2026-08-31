import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const nextConfig: NextConfig = {
  trailingSlash: true,
  turbopack: {
    root: repositoryRoot,
  },
  outputFileTracingRoot: repositoryRoot,
};

export default nextConfig;
