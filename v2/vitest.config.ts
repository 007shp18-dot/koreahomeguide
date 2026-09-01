import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/web', import.meta.url)),
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
    include: [
      'tests/**/*.test.{ts,tsx}',
      'packages/*/test/**/*.test.{ts,tsx}',
      'apps/*/test/**/*.test.{ts,tsx}',
    ],
  },
});
