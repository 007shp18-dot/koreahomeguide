import { writeFileSync } from 'node:fs';
import { publishSingaporeObservations } from '../lib/singapore/publication-build.server.ts';
const summary = await publishSingaporeObservations({ apply: process.argv.includes('--apply'), verifyFull: process.argv.includes('--verify-full'), onProgress: progress => console.log(JSON.stringify(progress)) });
if (process.env.SIGNEDPRICE_PUBLICATION_REPORT) writeFileSync(process.env.SIGNEDPRICE_PUBLICATION_REPORT, JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary));
