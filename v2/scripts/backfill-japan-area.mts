// Operator command; each execution is bounded and resumes persistent progress.
import { readJapanBackfillStatus, runJapanBackfill } from '../apps/web/lib/japan/backfill.server';
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--execute')) throw new Error('Use [--execute]; default only reads coverage.');
const result = args.includes('--execute')
  ? await runJapanBackfill({ apiKey: process.env.SIGNEDPRICE_REINFOLIB_API_KEY ?? '' })
  : await readJapanBackfillStatus();
process.stdout.write(JSON.stringify(result) + '\n');
