import { describe, expect, it } from 'vitest';
import v2Package from '../package.json';
import legacyPackage from '../../package.json';

describe('signedprice V2 workspace', () => {
  it('owns an independent release gate', () => {
    expect(v2Package.name).toBe('signedprice-platform');
    expect(v2Package.packageManager).toBe('pnpm@11.19.0');
    expect(Object.keys(v2Package.scripts)).toEqual(
      expect.arrayContaining(['lint', 'typecheck', 'test', 'build', 'e2e']),
    );
  });

  it('does not convert the legacy root into a workspace', () => {
    expect(legacyPackage.name).toBe('koreahomeguide');
    expect(legacyPackage).not.toHaveProperty('workspaces');
  });
});
