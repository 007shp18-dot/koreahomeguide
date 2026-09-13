# Regional property review release

The previous living-context page exposed Korean research notes on English routes and did not give readers a clear, property-specific conclusion. This release replaces that view with the approved review layout and detailed English/Korean content for three properties in each of Seoul, Singapore, Dubai and Tokyo.

## Reader experience

- Four review sections: verdict, transport, schools/daily life, and unit/ownership costs. No separate sources tab or footer sources button.
- Property and city selections survive language changes, reloads and browser back navigation through public query URLs.
- Compare the three reviewed properties within one city, save a review in the browser, and return from the existing Saved page.
- Continue to city transactions/maps and the existing budget shortlist. Tokyo links remain area-level evidence.
- Direct entry from Explore, Insights and existing linked building/project details. English/Korean canonical URLs and sitemap entries support discovery.

## Content and publication

The versioned JSON under `v2/apps/web/content/property-reviews/` contains 12 reviews and 144 detailed points. Each point retains a dated source relationship and distinguishes documented information, interpretation and checks still needed. The review does not turn portal walking estimates into measured routes, advertised prices into completed transactions, or planned Dubai infrastructure into current service. Chinese routes retain Chinese controls and explicitly identify the English review body.

`v2/apps/web/scripts/publish-property-reviews.mjs` validates all reviews, requires a local backup before writes, updates only the latest published record for each existing identity, and verifies every stored review against the release content. It adds `profile.review` without replacing existing facts or linking projects by fuzzy names. Run on the validation branch before production; use `--verify-only` to compare stored content without writes.

## Verification

- Content, publication boundaries, locale navigation and save-state parsing: 30 related tests passed.
- TypeScript and focused ESLint checks passed.
- Next.js production build passed; deployment builds provide the final release check.
- Research cross-review checked current school relocation, Tokyo lease/cost conditions, Dubai off-plan scope and school fees, and Singapore portal transaction examples.
- Browser and production deployment results are recorded with the release handoff.
