# KoreaHomeGuide Lead Protection, Privacy, Localization, and Explorer Map Design

**Date:** 2026-08-25  
**Status:** Approved direction; implementation plan pending  
**Operator:** KoreaHomeGuide (centralized so a later legal-name change is one edit)

## 1. Goal

Protect the lead funnel from spam and duplicate submissions, make email collection transparent, make Seoul place and housing-type labels understandable in English and Simplified Chinese, and add a useful map to Explore without turning the release into a building-geocoding project.

The design keeps stable internal identifiers separate from localized display labels. That is the only global-expansion foundation needed now; multi-country data ingestion, address search, routing, and building-level map markers are intentionally deferred.

## 2. Scope

### Included

- Rate-limit `POST /api/lead` by client IP at the Vercel firewall layer.
- Make normalized email addresses unique in the Google Apps Script sheet writer.
- Merge a later help request into the email's existing row rather than append another row.
- Add English and Simplified Chinese privacy pages and contextual form notices.
- Gate GA4 loading behind analytics consent.
- Centralize English, Chinese, Korean, and stable-ID labels for supported districts, neighborhoods, and housing types.
- Add a Google Maps view to the Explore experience, synchronized with neighborhood cards.
- Restrict the Google Maps key and avoid runtime geocoding.

### Excluded

- Building-level markers and address geocoding.
- Directions, commute-time, Places search, Street View, or nearby-place search.
- Seoul-wide polygon boundaries.
- Countries or cities outside the current Seoul dataset.
- Restoring the former homepage moving-service cards.

## 3. Lead Protection

### 3.1 Edge rate limit

Create a Vercel Firewall rate-limit rule with the following initial policy:

- Match: method `POST` and path `/api/lead`.
- Key: client IP.
- Limit: 10 requests per rolling hour.
- Action: deny with HTTP 429.
- Rollout: log, inspect, preview, then publish to production.

The application must not use an in-memory serverless counter. It is not durable across instances or regions. The API should retain the existing request-source validation as defense in depth, but must not treat `Origin` as abuse protection.

The site will not persist client IP addresses in the lead sheet.

### 3.2 Email uniqueness and idempotency

Google Apps Script already uses a script lock. Within the same lock:

1. Normalize email by trimming and lowercasing.
2. Look for an existing row with the normalized email.
3. For a repeated `lead_capture`, return idempotent success without appending.
4. For `help_request`, update the existing row's help flag, message, and latest timestamp.
5. If a help request arrives before a lead-capture row, create the single canonical row.

The public API returns the same generic success response for a new or duplicate submission. This avoids exposing whether an email is already in the sheet.

The sheet schema must preserve the current rent context, result, source page, UTM values, referrer, and optional help message. Any schema migration must be backward-compatible with existing rows.

## 4. Privacy and Analytics Consent

### 4.1 Privacy pages

Add `/privacy/` and `/zh/privacy/` with localized, plain-language sections covering:

- Operator/contact: KoreaHomeGuide and `hello@koreahomeguide.com`.
- Data collected: email, rent-check inputs/results, optional message, source page, referrer, and campaign parameters.
- Purposes: save/follow up on a rent check, send related rental guidance, and respond to requested help.
- Processors/services: Vercel, Google Apps Script/Sheets, and Google Analytics when consented.
- Retention: delete or anonymize lead records after 12 months unless continued retention is needed to respond to an active request or meet a legal obligation.
- User choices: request access, correction, or deletion by email.
- International processing/transfer explanation appropriate to the listed providers.
- Effective date and material-change notice.

Footer links must point to the matching locale. Each email form must show a short notice with a privacy link immediately next to the submit action.

### 4.2 GA4 consent

GA4 must not load before an affirmative analytics choice. Add a compact localized banner with Accept and Reject controls. Store the choice locally and provide a footer control to reopen or change it.

Essential site behavior, Rent Check, Explore, lead submission, and Google Maps must remain usable after analytics rejection. Map loading is functionally separate from GA4 consent and must be disclosed in the privacy page.

## 5. Localization Model

### 5.1 Stable IDs and display labels

The application and URLs continue to use stable identifiers such as `gangnam-gu`, `yeonnam-dong`, `apartment`, and `officetel`. A shared label registry supplies locale-specific display text.

Examples:

| Stable ID | English | Simplified Chinese | Korean reference |
|---|---|---|---|
| `gangnam-gu` | Gangnam-gu (강남구) | 江南区（강남구） | 강남구 |
| `mapo-gu` | Mapo-gu (마포구) | 麻浦区（마포구） | 마포구 |
| `yeonnam-dong` | Yeonnam-dong (연남동) | 延南洞（연남동） | 연남동 |

English retains official romanization rather than translating every `gu` to “District.” Chinese uses established Chinese place names and includes the Korean form as a practical aid for maps, contracts, and local search.

Unknown labels fall back in this order: requested locale, English, Korean reference, stable ID. Missing translations must never break filters or URLs.

### 5.2 Housing-type labels

Use market-recognizable labels while preserving the official category distinction:

| Stable ID | English label | Simplified Chinese label | Supporting explanation |
|---|---|---|---|
| `apartment` | Apartment (아파트) | 公寓（아파트） | Large apartment-complex category |
| `officetel` | Officetel (오피스텔) | Officetel（오피스텔） | Korean mixed-use residential/office building category |
| `villa` | Low-rise multifamily / Villa (연립·다세대) | 低层多户住宅 / Villa（연립·다세대） | “Villa” alone is avoided because its global meaning differs |
| `detached` | Detached & multi-unit house (단독·다가구) | 独栋及多户住宅（단독·다가구） | Official detached/multi-household grouping |
| `studio` | Studio / One-room (원룸) | 单间 / One-room（원룸） | UI convenience; explicitly not an official transaction category |

The registry replaces scattered display-name conditionals in explorer utilities, SEO rendering, and static HTML. SEO titles may use a shorter form where required, but must derive from the same registry.

## 6. Explorer Map

### 6.1 User experience

- Desktop: result cards on the left and a sticky map on the right.
- Mobile: map above the result cards with a bounded height; the card list remains the primary accessible content.
- Selecting a card highlights its marker and moves the map.
- Selecting a marker highlights or scrolls to its card.
- Existing filters update both cards and visible markers.
- The map is lazy-loaded only when its container approaches the viewport.

The first release uses curated centroid coordinates for supported districts and neighborhoods. It does not imply an exact property location.

### 6.2 Google Maps integration

- Use the Maps JavaScript API only; do not enable Places, Routes, or Geocoding for this release.
- Put the browser key in deployment configuration, never source control.
- Restrict the key to the production domain and required API.
- Configure billing alerts and a conservative daily quota.
- Current pricing assumption: 10,000 Dynamic Maps loads per month are free; usage above that is billed by Google under the active account's terms.

If the key is absent, blocked, over quota, or the script fails, show a localized “Map temporarily unavailable” state and keep all cards and filters operational.

### 6.3 Accessibility and performance

- Map markers and cards expose matching accessible labels.
- Keyboard users can use the complete card list without interacting with the map.
- Respect reduced-motion preferences when panning.
- Reserve the map container's dimensions to avoid layout shift.
- Do not preload tiles or initialize maps on pages that do not display one.

## 7. Existing `move_service_interest` Event

`move-commerce.js` defines a valid GA4 event named `move_service_interest` with these parameters:

- `city`
- `language`
- `service`: one of `internet`, `sim_esim`, `moving`, `cleaning`, `insurance`, or `relocation`
- `source`: `homepage_services`

It deduplicates repeated clicks on the same service only for the current page instance. It does not submit an email or write to Google Sheets.

The current English and Chinese homepages deliberately contain neither `data-move-service` controls nor the move-commerce initialization. Therefore the event is dormant and cannot generate new production events in the present UI, even though its unit tests pass.

This release will leave the dormant module unchanged and will not present it as a live funnel metric. A future service/referral experiment can restore localized service cards after defining the destination and consent-aware analytics behavior.

## 8. Error Handling

- Rate limit: localized retry-later message; preserve entered email locally in the form field.
- Duplicate email: generic success, same as a new submission.
- Sheet timeout/upstream failure: non-success response and a retry-safe user message.
- Analytics rejection/unavailability: no interface failure and no repeated consent prompt.
- Missing label: deterministic fallback without empty option text.
- Map failure: cards remain usable and no endless loading state.

## 9. Verification

Automated tests must cover:

- API method/source/body validation and generic duplicate success.
- Apps Script normalization, one-row uniqueness, help-request merge, and lock release.
- Locale registry coverage for every supported district, neighborhood, and property type.
- English/Chinese privacy links and form notices.
- GA4 absence before consent and loading after consent.
- Map/card synchronization, filtered markers, missing-key fallback, and mobile layout hooks.
- Existing Rent Check and calculator behavior as regression coverage.
- The dormant-state assertion for `move_service_interest` unless a later approved feature restores it.

Before production, verify the complete English and Chinese flows in a browser, inspect mobile overflow, stage the firewall rule, restrict the Google key, and confirm that no lead row is duplicated.

## 10. Rollout Order

1. Lead idempotency and sheet migration.
2. Privacy pages, form notices, and consent-aware analytics.
3. Shared localization registry and label migration.
4. Curated map coordinates and Explorer map UI.
5. Firewall rule log/preview and production publication.
6. End-to-end verification and deployment.
