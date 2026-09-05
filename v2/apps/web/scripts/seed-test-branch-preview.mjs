const isVercelPreview = process.env.VERCEL_ENV === 'preview';

if (!isVercelPreview) {
  process.stdout.write('SignedPrice test-branch property seed skipped outside Vercel preview.\n');
} else {
  process.env.DATABASE_URL = 'postgresql://neondb_owner@ep-rapid-grass-b34p9oiz.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
  process.stdout.write('SignedPrice test-branch property seed starting.\n');
  await import('./seed-property-core.mjs');
}
