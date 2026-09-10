import type { ResearchMarket, ResearchToolId } from './contract';

export async function recordToolCompletion(input: Readonly<{ tool: ResearchToolId; market: ResearchMarket }>): Promise<void> {
  if (typeof window === 'undefined') return;
  if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  try {
    if (window.localStorage.getItem('signedprice_analytics_consent_v1') === 'denied') return;
  } catch { return; }
  try {
    await fetch('/api/tools/usage/', {
      method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: input.tool, market: input.market }),
      signal: AbortSignal.timeout(3_000),
    });
  } catch { /* Optional counters never affect a calculation or retry automatically. */ }
}
