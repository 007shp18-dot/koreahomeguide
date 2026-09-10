# SignedPrice combined site audit · 2026-09-10

User authorized one ad hoc production deployment, explicitly including pending photos and SNS changes. Integrated PR: #287; includes #285 and #286. Older, unqueued draft PRs are not treated as deployable releases.

## Coverage and limits

- Route census: 122 page templates after adding EN/KO Saved. 84 live static paths, one intentional retired 404, 36 parameterized templates and one authenticated admin template. Machine-readable inventory: `site-audit-2026-09-10-routes.json`.
- The new browser census discovers every static page from the source tree, checks HTTP status, one visible H1 and viewport containment on desktop/mobile. The retired Seoul sell route must remain 404.
- Existing market/browser suites cover fixture-backed building/area/guide/article templates, selection, maps, localization, source boundaries, missing data and mobile/tablet/wide layouts. Build/type checks cover every page template. This is not a claim that every possible dynamic record URL or every production image was manually inspected.
- Production checks must follow the READY deployment. CI uses controlled evidence fixtures and does not establish production response time or real-user retention.

## Findings and corrections

| Finding | Correction | Acceptance |
|---|---|---|
| Seoul size selection lost between evidence and calculator | Preserve validated areaBand; require individual net-area confirmation before automatic KRW costs | 85-plus survives navigation; no default under-85 subtotal; explicit selection enables subtotal |
| First detail save has no observation baseline | Initialize only on first successful saved-evidence response | Old records show no new badge; later additions do; unavailable records do not reset state |
| Blocked browser storage reported as durable save | Surface session-only result | Save/remove work for session with truthful status |
| Saved entry missing outside city pages | EN/KO cross-city Saved page and common header entry | Existing local lists accessible without choosing a different city's calculator |
| Editorial tracking misses Korean, Tokyo and notebook routes | Bounded locale/market dimensions, source markers, route-aware observer; GA independent of Vercel flag | Valid events accepted, unknown dimensions and sensitive extra fields rejected; no new SDK |
| Insights repeats promoted stories and opens the wrong neighbourhood destination | Exclude promoted rows from remaining list, collapse buying steps, actual city Explore link | Same-city exploration is reachable; list de-duplicated by destination |
| Long Seoul history precedes comparable-size context | Size comparison before history; bounded scrollable history | All published rows retained; facts and tools follow evidence |
| Singapore initial empty list still shows page 1 of 1 | Hide pagination until non-empty, settled results | Region-selection prompt differs from no results and loading |
| HDB full-period table overwhelms private-project flow | Collapse all-town comparison, keep period scope visible | Full table remains accessible without implying a recent-period median |
| Tools footer drops locale | Forward locale to shared footer | KO/Chinese footer keeps matching labels and destinations |
| Photo and SNS changes queued separately | Integrate six reviewed photo assets and three confirmed social accounts | Combined tree includes both pending heads; one production release |

## Verification record

Local initial full tests: 3,070 passed, 84 skipped, two failures. Both corrected: the accepted evidence-section order and Tokyo must not be assigned Seoul-specific actions. Affected rerun: 46 passed. Further editorial rerun: 14 passed. Lint: zero errors, 12 existing warnings. Typecheck passed. Required combined CI, build and browser checks remain the release gate; exact final results are recorded on PR #287.

## Deferred product work

Financing, holding-period cash flow, sale proceeds, FX scenarios and scenario persistence are subsequent investment-product work, not implemented by this maintenance batch. Current yield remains explicitly limited to entered operating assumptions. Real retention needs measured cohorts over time; no retention lift or cost savings is claimed from test counts.
