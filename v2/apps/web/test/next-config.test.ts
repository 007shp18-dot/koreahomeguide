import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import nextConfig from '../next.config';

describe('Next monorepo file boundary', () => {
  it('lets Turbopack resolve and trace checked-in evidence outside the app folder', () => {
    const repositoryRoot = fileURLToPath(new URL('../../../../', import.meta.url));

    expect(nextConfig.turbopack?.root).toBe(repositoryRoot);
    expect(nextConfig.outputFileTracingRoot).toBe(repositoryRoot);
  });
});
