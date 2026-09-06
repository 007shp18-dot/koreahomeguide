export function googleMapsBrowserKeyFromEnvironment(): string | null {
  // Server-side photo credentials can have different API and origin restrictions.
  return process.env.GOOGLE_MAPS_BROWSER_KEY?.trim() || null;
}
