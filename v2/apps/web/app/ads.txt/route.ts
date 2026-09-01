const ADSENSE_PUBLISHER_ID = /^pub-[0-9]{16}$/;

export function GET(): Response {
  const publisherId = process.env.SIGNEDPRICE_ADSENSE_PUBLISHER_ID?.trim() ?? '';
  if (!ADSENSE_PUBLISHER_ID.test(publisherId)) {
    return new Response('AdSense publisher record is not configured.\n', {
      status: 503,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }
  return new Response(
    `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`,
    {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  );
}
