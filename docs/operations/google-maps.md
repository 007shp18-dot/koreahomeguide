# Google Maps setup

KoreaHomeGuide uses only the Google Maps JavaScript API on the English and Chinese Rent Explorer pages. The implementation does not enable Places, Routes, Geocoding, Street View, or building-level locations.

## Key and restrictions

- Vercel environment variable: `GOOGLE_MAPS_BROWSER_KEY`
- Website referrers: `https://koreahomeguide.com/*` and `https://www.koreahomeguide.com/*`
- Add only the exact Vercel Preview hostname while testing; remove it afterward if no longer needed.
- API restriction: Maps JavaScript API only

Browser keys are visible by design. Security comes from both Website/HTTP-referrer restrictions and the API restriction. Use a separate key for this website and never reuse a server-side key.

## Cost controls

As of 2026-08-25, Google's Dynamic Maps SKU includes 10,000 no-cost monthly map loads; the next tier is USD $7 per 1,000 loads. Recheck the official price before changing budgets.

- Set billing alerts at 50%, 80%, and 100% of the chosen monthly budget.
- Start with a Dynamic Maps quota below 10,000 monthly loads and raise it only after reviewing Explorer traffic.
- The map lazy-loads near the viewport so visits that never reach it do not create a map load.

References: [Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing), [API key security](https://developers.google.com/maps/api-security-best-practices)

## Verification

Without the environment variable, both Explore pages must show a localized unavailable message while all rent data, filters, and cards continue working. With the restricted key, verify the map on the two production hostnames and confirm that an unapproved hostname fails safely.
