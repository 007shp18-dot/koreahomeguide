KoreaHomeGuide combined update — 2026-08-25

Upload the CONTENTS of this folder to the repository root, preserving paths.

Included:
1) P0 MOLIT API hardening
   - supported Seoul district/property allowlists
   - recent completed-month guard for /api/real-prices
   - production request-source checks
   - 5-second data.go.kr timeout
   - safe Vercel error logging
   - no fake per-instance Map rate limiter

2) Explorer median fix
   - top Median monthly rent / Median deposit now use true overall summary medians
   - deposit-band medians remain only as contextual neighborhood/building values

3) Guides hub
   - /guides/
   - /zh/guides/
   - Explorer and dynamic SEO header navigation points to the hub

4) Five new English market districts
   - Gwanak-gu
   - Dongdaemun-gu
   - Seodaemun-gu
   - Seongbuk-gu
   - Gwangjin-gu
   x apartment / officetel / villa = 15 pages

5) v10.9 Phase 2
   - “All supported Seoul” Explorer mode
   - /api/explore-seoul
   - 10 districts x latest 3 completed months
   - upstream work is processed in bounded batches
   - neighborhood ranking continues to use actual matching signed-contract evidence

6) SEO safeguards
   - static sitemap grows from 46 to 63 URLs
   - new five districts are EN market pages first
   - dynamic Chinese sitemap discovery stays limited to the five already-localized districts

Verification in isolated patch workspace:
- 26/26 targeted tests passed
- modified JS/CJS syntax checks passed
- 15 new market pages confirmed
- 2 guide hubs confirmed
- 63 static sitemap URLs confirmed
- no Wise / affiliate / referral code added

Important remaining Vercel setting:
A reliable global IP rate limit is platform state, not something a module-level JS Map can enforce
across serverless instances. After deployment, configure Vercel Firewall rate limits using:
docs/operations/2026-08-25-api-protection.md

Suggested starting limits are documented there.

Note:
The full repository test suite could not be executed from the isolated patch workspace because the
connected GitHub repository is readable but not writable/mountable as a local checkout in this
session. The two existing tests that hard-coded the old 46-URL sitemap count are included with
their expected count updated to 63.
