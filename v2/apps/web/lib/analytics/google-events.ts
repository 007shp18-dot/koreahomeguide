/** Send validated product dimensions through the already-configured Google tag. */
export function sendGoogleEvent(event: string, properties: Readonly<Record<string, string | number | boolean>>) {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem('signedprice_analytics_consent_v1') === 'denied') return;
  } catch {
    // The configured tag also respects the in-memory ga-disable flag.
  }
  const target = window as unknown as { gtag?: (command: string, name: string, params: Record<string, unknown>) => void };
  if (typeof target.gtag !== 'function') return;
  try {
    // Only coarse dimensions; never forward entered amounts, addresses or queries.
    const allowed = ['market', 'contentId', 'contentType', 'locale', 'destinationFamily', 'surface', 'tool', 'guide', 'action'];
    const params = Object.fromEntries(Object.entries(properties).filter(([key]) => allowed.includes(key)));
    target.gtag('event', event, { ...params, page_location: `${window.location.origin}${window.location.pathname}` });
  } catch {
    // A blocked provider must not prevent navigation or calculation.
  }
}
