import 'server-only';
import { MOLIT_SALE_ENDPOINTS, parseMolitSalePage, SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent';
import { exactToken } from './korea-sale-job-handler.server';

type Dependencies = { environment?: string; token?: string; serviceKey?: string; fetch: typeof globalThis.fetch; now?: () => Date };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });
/** Protected, read-only export of one official page, including cancelled transactions. */
export function createHistoryHandler(deps: Dependencies) {
 return async (request: Request): Promise<Response> => {
  if (deps.environment !== 'preview') return json({code:'preview_only'},403);
  if (!deps.token || deps.token.length < 24) return json({code:'configuration_missing'},503);
  if (!exactToken(request.headers.get('authorization'),deps.token,Date.now())) return json({code:'unauthorized'},401);
  if (request.method !== 'POST') return json({code:'method_not_allowed'},405);
  if (!deps.serviceKey) return json({code:'configuration_missing'},503);
  let body;
  try { body = await request.json(); } catch { return json({code:'invalid_request'},400); }
  const now = (deps.now ?? (() => new Date()))();
  const latest = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).format(now).replace(/[^0-9]/g,'');
  if (!body || typeof body !== 'object' || Object.keys(body).length !== 3 ||
   !SEOUL_RENT_CHECK_DISTRICTS.some(d => d.lawdCd === body.lawdCd) ||
   typeof body.dealYmd !== 'string' || !/^20[0-9]{2}(0[1-9]|1[0-2])$/.test(body.dealYmd) ||
   body.dealYmd < '202001' || body.dealYmd > latest ||
   !Number.isSafeInteger(body.pageNo) || body.pageNo < 1 || body.pageNo > 100) return json({code:'invalid_request'},400);
  const {lawdCd,dealYmd,pageNo} = body;
  const url = new URL(MOLIT_SALE_ENDPOINTS.apartment.url);
  url.search = new URLSearchParams({serviceKey:deps.serviceKey,LAWD_CD:lawdCd,DEAL_YMD:dealYmd,pageNo:String(pageNo),numOfRows:'1000'}).toString();
  try {
   const response = await deps.fetch(url,{cache:'no-store',signal:AbortSignal.timeout(45000)});
   if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    return json({code:'provider_http_error',providerStatus:response.status,
     ...(retryAfter && /^\d+$/.test(retryAfter) ? {retryAfterSeconds:Number(retryAfter)} : {})},502);
   }
   const xml = await response.text();
   if (xml.length > 3000000 || xml.includes(deps.serviceKey)) return json({code:'unsafe_provider_payload'},502);
   const page = parseMolitSalePage(xml,{sourceHousingType:'apartment',expectedPageNo:pageNo,expectedPageSize:1000,expectedDealYmd:dealYmd,expectedLawdCd:lawdCd});
   return json({lawdCd,dealYmd,pageNo,pageSize:page.pageSize,totalCount:page.totalCount,recordCount:page.rows.length,fetchedAt:now.toISOString(),source:MOLIT_SALE_ENDPOINTS.apartment.url,xml});
  } catch { return json({code:'provider_unavailable_or_invalid'},502); }
 };
}
