#!/usr/bin/env node

import { spawn } from 'node:child_process';
import {
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

const port = process.argv[2];
if (port === undefined || !/^\d{2,5}$/.test(port)) {
  throw new Error('A valid local Playwright port is required.');
}

const encodedFixture = process.env.SIGNEDPRICE_PLAYWRIGHT_PROXIMITY_GZIP_BASE64;
if (encodedFixture === undefined || encodedFixture.length === 0) {
  throw new Error('The Playwright proximity fixture is required.');
}
const runtimeEnvironment = { ...process.env };
delete runtimeEnvironment.SIGNEDPRICE_PLAYWRIGHT_PROXIMITY_GZIP_BASE64;

const workspaceRoot = process.cwd();
const appDirectory = resolve(workspaceRoot, 'apps/web');
const nextExecutable = resolve(appDirectory, 'node_modules/next/dist/bin/next');
const fixturePath = resolve(appDirectory, 'data/korea-proximity.json.gz');
let fixtureCreated = false;
let activeChild;
let shuttingDown = false;
let forceShutdownTimer;

function cleanupFixture() {
  if (!fixtureCreated) return;
  rmSync(fixturePath, { force: true });
  fixtureCreated = false;
}

function forwardSignal(signal) {
  shuttingDown = true;
  if (activeChild === undefined) {
    cleanupFixture();
    return;
  }
  activeChild.kill(signal);
  forceShutdownTimer = setTimeout(() => activeChild?.kill('SIGKILL'), 4_000);
  forceShutdownTimer.unref();
}

for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.once(signal, () => forwardSignal(signal));
}

function run(command, args, cwd) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, {
      cwd,
      env: runtimeEnvironment,
      stdio: 'inherit',
    });
    activeChild = child;
    child.once('error', (error) => {
      if (activeChild === child) activeChild = undefined;
      rejectCommand(error);
    });
    child.once('exit', (code, signal) => {
      if (activeChild === child) activeChild = undefined;
      if (forceShutdownTimer !== undefined) clearTimeout(forceShutdownTimer);
      if (shuttingDown || code === 0) {
        resolveCommand();
        return;
      }
      rejectCommand(new Error(
        `${command} exited with ${signal === null ? `code ${String(code)}` : signal}.`,
      ));
    });
  });
}

try {
  await run('pnpm', ['--filter', '@signedprice/web', 'build'], workspaceRoot);
  if (!shuttingDown) {
    writeFileSync(
      fixturePath,
      Buffer.from(encodedFixture, 'base64'),
      { flag: 'wx' },
    );
    fixtureCreated = true;
    await run(
      process.execPath,
      [nextExecutable, 'start', appDirectory, '--hostname', '127.0.0.1', '--port', port],
      workspaceRoot,
    );
  }
} finally {
  cleanupFixture();
}
