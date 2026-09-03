import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/web', import.meta.url)),
      'next/font/google': fileURLToPath(new URL('./apps/web/test/next-font-google.mock.ts', import.meta.url)),
    },
  },
  plugins: [
    {
      name: 'geojson-module',
      transform(source, id) {
        if (!id.split('?')[0]?.endsWith('.geojson')) return undefined;
        return { code: `export default ${source};`, map: null };
      },
    },
  ],
  test: {
    testTimeout: 15_000,
    include: [
      'tests/**/*.test.{ts,tsx}',
      'packages/*/test/**/*.test.{ts,tsx}',
      'apps/*/test/**/*.test.{ts,tsx}',
    ],
  },
});
