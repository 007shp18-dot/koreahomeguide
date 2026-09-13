export const REVIEW_SAVED_KEY = 'signedprice_property_reviews_v1';
const eventName = 'signedprice:property-reviews';
export function parseReviewSaved(raw: string): string[] {
  if (raw.length > 20_000) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && /^(kr|sg|ae|jp)-[a-z0-9-]{1,100}$/.test(id)))].slice(0,100) : [];
  } catch { return []; }
}
let volatile: string | null = null;
export function readReviewSaved(): string {
  if (volatile !== null) return volatile;
  try { return window.localStorage.getItem(REVIEW_SAVED_KEY) ?? ''; } catch { return ''; }
}
export const reviewSavedIsSessionOnly = () => volatile !== null;
export function subscribeReviewSaved(listener: () => void) {
  const changed = (event: StorageEvent) => { if (event.key === null || event.key === REVIEW_SAVED_KEY) { volatile = null; listener(); } };
  window.addEventListener('storage', changed); window.addEventListener(eventName, listener);
  return () => { window.removeEventListener('storage', changed); window.removeEventListener(eventName, listener); };
}
export function toggleReviewSaved(id: string): void {
  const ids = parseReviewSaved(readReviewSaved());
  const next = JSON.stringify(parseReviewSaved(JSON.stringify(ids.includes(id) ? ids.filter(saved => saved !== id) : [...ids, id])));
  try { window.localStorage.setItem(REVIEW_SAVED_KEY, next); volatile = null; } catch { volatile = next; }
  window.dispatchEvent(new Event(eventName));
}
