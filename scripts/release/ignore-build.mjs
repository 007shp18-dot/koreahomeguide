import {fileURLToPath} from 'node:url';
// Used only by the release coordinator to identify pending runtime work.
export function isRuntimeChange(file) {
  if (/^(docs\/|\.github\/|tests\/)/.test(file) || /(^|\/)(test|tests)\//.test(file) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) || /(^|\/)(AGENTS|README)\.md$/.test(file)) return false;
  return /^(v2\/|artifacts\/|scripts\/|package\.json|pnpm-lock\.yaml)/.test(file);
}
// Compatibility for existing external Ignored Build Step references.
// No commit, environment, branch, or changed-file exclusions remain.
export function shouldBuild() {
  return true;
}
if (process.argv[1]===fileURLToPath(import.meta.url)) {
  console.log('Build exclusions disabled: continue build');
  // Vercel treats exit 1 as continue, and exit 0 as skip.
  process.exit(1);
}
