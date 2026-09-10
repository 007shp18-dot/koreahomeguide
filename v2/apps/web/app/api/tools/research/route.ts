import { createToolResearchEnvironment } from '../../../../lib/tool-research/environment.server';
import { createToolResearchRouteHandlers } from '../../../../lib/tool-research/route-handler.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handlers = createToolResearchRouteHandlers(createToolResearchEnvironment);

export const PUT = handlers.PUT;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
