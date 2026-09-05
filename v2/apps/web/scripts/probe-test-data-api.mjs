const DATA_API = 'https://ep-rapid-grass-b34p9oiz.apirest.c-4.ap-southeast-1.aws.neon.tech/neondb/rest/v1';
if (process.env.VERCEL !== '1' || process.env.VERCEL_ENV !== 'preview' || process.env.VERCEL_GIT_COMMIT_REF !== 'codex/signedprice-db-seed-export') process.exit(0);
const token = process.env.VERCEL_OIDC_TOKEN?.trim();
if (!token) throw new Error('VERCEL_OIDC_TOKEN unavailable.');
const response = await fetch(`${DATA_API}/rpc/signedprice_oidc_probe`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: '{}',
  signal: AbortSignal.timeout(15_000),
});
const text = await response.text();
if (!response.ok) throw new Error(`OIDC probe failed (${response.status}): ${text.slice(0, 500)}`);
const claims = JSON.parse(text);
if (claims.owner_id !== 'team_z0V395RObbAEvC2AJCvLhXXF'
  || claims.project_id !== 'prj_FlviCE6qvhYYScYNSIbrRSt7VDnd'
  || claims.project !== 'signedprice' || claims.environment !== 'preview') {
  throw new Error(`OIDC probe returned unexpected claims: ${JSON.stringify(claims)}`);
}
process.stdout.write(`SignedPrice OIDC probe verified: project=${claims.project}, environment=${claims.environment}.\n`);
