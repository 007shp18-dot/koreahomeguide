import {fileURLToPath} from 'node:url';

const previewMarker = /\[vercel-preview\]/i;

export function shouldBuild(input = {}) {
  const environment = input.environment ?? process.env.VERCEL_ENV;
  const branch = input.branch ?? process.env.VERCEL_GIT_COMMIT_REF;
  const message = input.message ?? process.env.VERCEL_GIT_COMMIT_MESSAGE ?? '';

  // Missing Git metadata is treated as a manual/bootstrap deployment and is
  // allowed. Production and main must never be accidentally skipped.
  if (!environment && !branch) return true;
  if (environment === 'production' || branch === 'main') return true;

  // Preview builds are opt-in because CI already runs the complete local build
  // and browser suite. Add [vercel-preview] to a commit when a hosted preview is
  // specifically needed for review.
  return previewMarker.test(message);
}
if (process.argv[1]===fileURLToPath(import.meta.url)) {
  const build = shouldBuild();
  console.log(build
    ? 'Vercel cost gate: continue build'
    : 'Vercel cost gate: skip automatic preview build');
  // Vercel treats exit 1 as continue, and exit 0 as skip.
  process.exit(build ? 1 : 0);
}
