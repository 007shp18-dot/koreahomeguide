import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const destination = resolve(process.cwd(), 'app/api/internal/property-seed-runner/seed-password.generated.ts');
if (process.env.VERCEL !== '1') {
  writeFileSync(destination, 'export const SEED_PASSWORD: string | null = null;\n', 'utf8');
  process.stdout.write('SignedPrice seed runner password generation skipped outside Vercel.\n');
  process.exit(0);
}
const password = `spseed_${randomBytes(24).toString('hex')}`;
writeFileSync(destination, `export const SEED_PASSWORD: string | null = '${password}';\n`, 'utf8');
process.stdout.write(`SIGNEDPRICE_SEED_RUNNER_PASSWORD ${password}\n`);
