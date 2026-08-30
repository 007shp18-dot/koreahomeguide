import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectStaticRoutes } from '../../scripts/v2-migration/collect-static-routes.cjs';
import { verifyPhase0 } from '../../scripts/v2-migration/verify-phase-0.cjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function copyRepository() {
  const target = mkdtempSync(join(tmpdir(), 'signedprice-v2-build-output-'));
  cpSync(ROOT, target, {
    recursive: true,
    filter(source) {
      const name = basename(source);
      return name !== '.git' && name !== 'node_modules';
    },
  });
  return target;
}

describe('legacy isolation', () => {
  it('ignores top-level V2 build HTML in Phase 0 and repository-wide legacy HTML tests', () => {
    const temporaryRoot = copyRepository();
    try {
      const buildIndex = join(temporaryRoot, 'v2', 'apps', 'web', '.next', 'server', 'app', 'index.html');
      mkdirSync(dirname(buildIndex), { recursive: true });
      writeFileSync(buildIndex, '<!doctype html><html><body>V2 build output</body></html>\n', 'utf8');

      expect(collectStaticRoutes(temporaryRoot)).toEqual(collectStaticRoutes(ROOT));
      expect(verifyPhase0(temporaryRoot)).toEqual({ ok: true, missing: [], mismatches: [] });

      for (const file of ['tests/mobile-navigation.test.cjs', 'tests/privacy-pages.test.cjs']) {
        const result = spawnSync(process.execPath, ['--test', file], {
          cwd: temporaryRoot,
          encoding: 'utf8',
        });
        expect(result.status, `${file}\n${result.stdout}\n${result.stderr}`).toBe(0);
      }
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });
});
