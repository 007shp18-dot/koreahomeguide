KoreaHomeGuide — Lead protection, localization, and map patch
Date: 2026-08-25

APPLY
-----
Upload the CONTENTS of this folder to the repository root, preserving paths.
Then run the repository test/deploy workflow.

WHAT CHANGES
------------
1. Lead form layout
   - The email field keeps a flexible column and no longer gets clipped by consent copy.
   - Forms marked hidden remain hidden even when the shared form layout is active.
   - The optional help form uses the shared primary button style.

2. Lead data protection
   - Email is normalized and treated as the unique Google Sheet key.
   - Repeated captures update one row; help requests enrich that same row.
   - Privacy pages and point-of-collection notices are available in English and Chinese.
   - GA4 loads automatically through the shared analytics loader.

3. Localized market labels
   - Stable district/property values are preserved for URLs and APIs.
   - English and Chinese UI labels include the Korean contract/search term.
   - Officetel remains recognizable as Officetel (오피스텔).
   - Ambiguous global "Villa" wording is replaced with an explanatory low-rise label.

4. Rent Explorer map
   - Adds a lazy-loaded Google Map beside neighborhood results on desktop and first on mobile.
   - Marker/card selection stays synchronized.
   - Missing keys or SDK failures show a usable fallback instead of breaking the Explorer.

REQUIRED AFTER UPLOAD
---------------------
1. Redeploy ops/google-apps-script/lead-webhook.gs as the existing Apps Script Web App.
2. Keep these Vercel variables configured:
   - LEAD_SHEET_WEBHOOK_URL
   - LEAD_SHEET_SHARED_SECRET
3. Add GOOGLE_MAPS_BROWSER_KEY in Vercel.
   Restrict the key to production/preview website referrers and the Maps JavaScript API.
4. In Vercel Firewall, create a rate limit for POST /api/lead:
   - key: client IP
   - limit: 10 requests
   - window: 1 hour
   - response: HTTP 429

Operations guides:
- docs/operations/google-sheet-lead-capture.md
- docs/operations/lead-rate-limit.md
- docs/operations/google-maps.md

EVENT STATUS
------------
move_service_interest remains defined and unit-tested in move-commerce.js, but it is
intentionally dormant: current homepages do not load the script or expose matching controls.

VERIFICATION
------------
- Full test suite: 253 passed, 0 failed.
- All JavaScript/CommonJS source files pass node --check.

No production deployment, Google Cloud key creation, Vercel Firewall mutation, or Apps
Script Web App redeployment is performed by this local patch.
