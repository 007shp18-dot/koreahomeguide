const keys = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'NEON_DATABASE_URL',
  'PGHOST',
  'PGDATABASE',
  'PGUSER',
];
console.log(`SignedPrice DB env presence: ${keys.map((key) => `${key}=${process.env[key]?.trim() ? 'present' : 'absent'}`).join(', ')}`);
