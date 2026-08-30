import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL('../../.github/workflows/signedprice-v2-ci.yml', import.meta.url),
  'utf8',
);

describe('signedprice V2 browser CI contract', () => {
  it('runs the full Phase 0 gate once from the repository root before browsers', () => {
    expect(workflow.match(/node scripts\/v2-migration\/verify-phase-0\.cjs/g) ?? []).toHaveLength(1);
    expect(workflow).toMatch(
      /name: Run full Phase 0 legacy gate\n\s+working-directory: \.\n\s+run: node scripts\/v2-migration\/verify-phase-0\.cjs/,
    );
    expect(workflow).toMatch(/browser:\n\s+needs: verify/);
  });

  it('triggers when V2 or Phase 0 contract inputs change without duplicate runs', () => {
    for (const path of [
      "'v2/**'",
      "'artifacts/v2-migration/**'",
      "'scripts/v2-migration/**'",
      "'tests/**/*.test.cjs'",
      "'.github/workflows/signedprice-v2-ci.yml'",
    ]) {
      expect(
        workflow.match(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? [],
      ).toHaveLength(2);
    }

    expect(workflow).toMatch(/concurrency:\n\s+group: signedprice-v2-/);
    expect(workflow).toMatch(/cancel-in-progress: true/);
  });

  it('installs locked Chromium and executes both browser projects', () => {
    expect(workflow).toMatch(/pnpm exec playwright install --with-deps chromium/);
    expect(workflow).toMatch(
      /pnpm e2e --project=desktop-chromium --project=mobile-chromium/,
    );
  });

  it('retains browser diagnostics only when the gate fails', () => {
    expect(workflow).toMatch(/uses: actions\/upload-artifact@v4/);
    expect(workflow).toMatch(/if: failure\(\)/);
    expect(workflow).toMatch(/v2\/test-results/);
    expect(workflow).toMatch(/v2\/playwright-report/);
  });
});
