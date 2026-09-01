import { SIGNEDPRICE_ADSENSE_PUBLISHER_ID } from '../../lib/advertising/adsense-publisher';

export function GET(): Response {
  return new Response(
    `google.com, ${SIGNEDPRICE_ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`,
    {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  );
}
