import 'server-only';

import { createCommunityEnvironment } from '../../../../lib/community/community-environment.server';
import { createCommunityRouteHandlers } from '../../../../lib/community/community-route-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handlers = createCommunityRouteHandlers(createCommunityEnvironment);

export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
