import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

type VercelConfig = {
  ignoreCommand?: string;
};

const repositoryRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function readIgnoreCommand(relativePath: string) {
  const config = JSON.parse(
    readFileSync(resolve(repositoryRoot, relativePath), 'utf8'),
  ) as VercelConfig;

  expect(config.ignoreCommand).toBeTypeOf('string');
  return config.ignoreCommand as string;
}

function run(command: string, cwd: string) {
  return spawnSync(command, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32' ? 'powershell.exe' : true,
  });
}

function git(cwd: string, ...args: string[]) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
}

function writeFixtureFile(repository: string, relativePath: string, value: string) {
  const absolutePath = join(repository, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, value);
}

function createChangedRepository(relativePath: string) {
  const repository = mkdtempSync(join(tmpdir(), 'signedprice-vercel-boundary-'));

  git(repository, 'init', '--quiet');
  git(repository, 'config', 'user.email', 'tests@signedprice.invalid');
  git(repository, 'config', 'user.name', 'SignedPrice tests');

  writeFixtureFile(repository, 'index.html', 'legacy home\n');
  writeFixtureFile(repository, 'docs/superpowers/plan.md', 'plan\n');
  writeFixtureFile(repository, 'v2/apps/web/page.tsx', 'signedprice app\n');
  writeFixtureFile(repository, 'v2/packages/korea-rent/index.ts', 'rent package\n');
  git(repository, 'add', '.');
  git(repository, 'commit', '--quiet', '-m', 'base');

  writeFixtureFile(repository, relativePath, `changed ${relativePath}\n`);
  git(repository, 'add', '.');
  git(repository, 'commit', '--quiet', '-m', `change ${relativePath}`);

  return repository;
}

function ignoreStatus(
  command: string,
  changedPath: string,
  projectRoot: '.' | 'v2/apps/web',
) {
  const repository = createChangedRepository(changedPath);
  return run(command, resolve(repository, projectRoot)).status;
}

describe('Vercel project deployment boundaries', () => {
  it('builds KoreaHomeGuide only for legacy-root changes', () => {
    const command = readIgnoreCommand('vercel.json');

    expect(ignoreStatus(command, 'index.html', '.')).toBe(1);
    expect(ignoreStatus(command, 'v2/apps/web/page.tsx', '.')).toBe(0);
    expect(ignoreStatus(command, 'docs/superpowers/plan.md', '.')).toBe(0);
  });

  it('builds SignedPrice only for changes inside v2', () => {
    const command = readIgnoreCommand('v2/apps/web/vercel.json');

    expect(ignoreStatus(command, 'index.html', 'v2/apps/web')).toBe(0);
    expect(ignoreStatus(command, 'v2/apps/web/page.tsx', 'v2/apps/web')).toBe(1);
    expect(ignoreStatus(command, 'v2/packages/korea-rent/index.ts', 'v2/apps/web')).toBe(1);
  });
});
