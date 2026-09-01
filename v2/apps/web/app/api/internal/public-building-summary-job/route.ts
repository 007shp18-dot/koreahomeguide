import 'server-only';

import {
  finalizeKoreaPublicBuildingSummaryJob,
  runKoreaPublicSummaryBatch,
} from '@signedprice/korea-rent';

import { buildPublicBuildingSummaryArtifact } from '@/lib/public-market/building-artifact-builder.server';
import {
  createPublicBuildingJobPostHandler,
  publicBuildingJobMethodNotAllowed,
} from '@/lib/public-market/building-job-handler.server';
import { createPublicBuildingJobRuntimeCache } from '@/lib/public-market/public-building-job-cache.server';

const cache = createPublicBuildingJobRuntimeCache();
const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = createPublicBuildingJobPostHandler({
  vercelEnv: process.env.VERCEL_ENV,
  serviceKey,
  runBatch(input) {
    return runKoreaPublicSummaryBatch(input, {
      serviceKey: serviceKey!, cache, fetch: globalThis.fetch,
      now: () => new Date(), coordinateLimit: 20,
    });
  },
  finalize(input) {
    return finalizeKoreaPublicBuildingSummaryJob(input, { cache, now: () => new Date() });
  },
  buildArtifact: buildPublicBuildingSummaryArtifact,
});

export function GET(): Response {
  if (process.env.VERCEL_ENV !== 'preview') return new Response(null, { status: 404 });
  const html = `<!doctype html><html><head><meta name="robots" content="noindex,nofollow"><title>Building artifact runner</title></head>
<body><button id="run" type="button">Run verified building artifact</button><pre id="status">Idle</pre><textarea id="artifact" hidden></textarea>
<script>
const button=document.getElementById('run');const status=document.getElementById('status');const artifact=document.getElementById('artifact');
const referenceInstant='2026-08-30T00:00:00.000Z';
async function post(body){const response=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await response.json();if(!response.ok)throw new Error(JSON.stringify(value));return value;}
button.addEventListener('click',async()=>{button.disabled=true;let cursor=0;try{while(cursor<700){let retries=0;for(;;){try{const value=await post({action:'batch',referenceInstant,cursor});cursor=value.nextCursor;status.textContent='Source '+cursor+'/700';break;}catch(error){if(++retries>5)throw error;status.textContent='Retry '+cursor+'/700';await new Promise(resolve=>setTimeout(resolve,1500));}}}const result=await post({action:'finalize',referenceInstant});artifact.value=result.artifact;status.textContent='COMPLETE '+JSON.stringify({...result,artifact:undefined});}catch(error){status.textContent='ERROR '+String(error);}finally{button.disabled=false;}});
</script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
export const HEAD = publicBuildingJobMethodNotAllowed;
export const OPTIONS = publicBuildingJobMethodNotAllowed;
export const PUT = publicBuildingJobMethodNotAllowed;
export const PATCH = publicBuildingJobMethodNotAllowed;
export const DELETE = publicBuildingJobMethodNotAllowed;
