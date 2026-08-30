import { buildReleaseStatus } from '../../../lib/release-status';

export function GET(): Response {
  const status = buildReleaseStatus({
    commit: process.env.VERCEL_GIT_COMMIT_SHA,
    environment: process.env.VERCEL_ENV,
  });

  return Response.json(status, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
