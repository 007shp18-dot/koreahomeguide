import { NextResponse } from 'next/server';
import { readUraCredential } from '@signedprice/singapore-property';
import {
  checkParam,
  fetchUra,
  isUraService,
  URA_SERVICES,
  UraError,
} from '../../../lib/ura';

/**
 * Proxy for the URA Data Service.
 *
 * It exists so the AccessKey stays on the server. Calling URA from the browser
 * would hand the key to every visitor, and the key is scoped to us — someone
 * else spending our daily quota is not a theoretical problem.
 *
 * The route never echoes the key, and it reports why a call failed rather than
 * returning an empty list, so "URA rejected us" and "there were no rows" stay
 * distinguishable in the logs.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache lengths follow URA's own publication rhythm: transactions land twice a
// week, rentals and developer sales monthly, medians and pipeline quarterly.
const MAX_AGE: Record<string, number> = {
  PMI_Resi_Transaction: 60 * 60 * 6,
  PMI_Resi_Rental: 60 * 60 * 24,
  PMI_Resi_Rental_Median: 60 * 60 * 24,
  PMI_Resi_Developer_Sales: 60 * 60 * 24,
  PMI_Resi_Pipeline: 60 * 60 * 24,
};

export async function GET(request: Request) {
  let accessKey: string;
  try {
    accessKey = readUraCredential().accessKey;
  } catch {
    // Deliberately vague to the caller, explicit in the server log.
    console.error('SIGNEDPRICE_URA_ACCESS_KEY is not set');
    return NextResponse.json({ error: 'Singapore data is not configured.' }, { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const service = params.get('service');

  if (!service || !isUraService(service)) {
    return NextResponse.json(
      { error: 'Unknown service.', allowed: Object.keys(URA_SERVICES) },
      { status: 400 },
    );
  }

  const rule = URA_SERVICES[service];
  const value = rule.param === null ? null : params.get(rule.param);
  const check = checkParam(service, value);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  try {
    const { result, count } = await fetchUra(accessKey, service, value);

    return NextResponse.json(
      { service, param: value, count, result },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${MAX_AGE[service] ?? 3600}, stale-while-revalidate=86400`,
        },
      },
    );
  } catch (error) {
    if (error instanceof UraError) {
      console.error('URA request failed', {
        service,
        value,
        upstreamStatus: error.upstreamStatus,
        message: error.message,
      });
      return NextResponse.json(
        { error: 'Upstream request failed.', reason: error.message, upstreamStatus: error.upstreamStatus },
        { status: error.status },
      );
    }

    console.error('URA request threw', error);
    return NextResponse.json({ error: 'Upstream request failed.' }, { status: 502 });
  }
}
