export function googleMapsBrowserKeyFromEnvironment(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY?.trim()
    || process.env.GOOGLE_MAPS_BROWSER_KEY?.trim()
    || null;
}
