import {fileURLToPath} from 'node:url';
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
