import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

async function git(cwd, args) {
  return (await run('git', args, { cwd })).stdout.trim();
}

export async function publishKoreaProximityBranch({ cwd, branch, artifactPath, remote = 'origin' }) {
  await git(cwd, ['fetch', remote, `+refs/heads/${branch}:refs/remotes/${remote}/${branch}`]).catch(() => undefined);
  let expected = '';
  try {
    expected = await git(cwd, ['rev-parse', `refs/remotes/${remote}/${branch}`]);
    await git(cwd, ['switch', '--create', branch, `${remote}/${branch}`]);
  } catch {
    await git(cwd, ['switch', '--create', branch]);
  }
  await git(cwd, ['config', 'user.name', 'signedprice-refresh[bot]']);
  await git(cwd, ['config', 'user.email', 'signedprice-refresh[bot]@users.noreply.github.com']);
  await git(cwd, ['add', artifactPath]);
  await git(cwd, ['commit', '-m', 'chore: refresh Korea proximity artifact']);
  const ref = `HEAD:refs/heads/${branch}`;
  await git(cwd, ['push', `--force-with-lease=refs/heads/${branch}:${expected}`, remote, ref]);
  return git(cwd, ['rev-parse', 'HEAD']);
}

async function main() {
  await publishKoreaProximityBranch({
    cwd: process.cwd(),
    branch: 'automation/korea-proximity-refresh',
    artifactPath: 'v2/artifacts/korea-proximity/signedprice-korea-proximity-v1.json.gz',
  });
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) await main();
