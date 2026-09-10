# Saved-home decision comparison design

## Scope

Extend the existing browser-only saved-home comparison without creating an account, server sync, public review, address field, landlord field, or broker field. Existing saved quotes under `khg_saved_rent_quotes_v1` must remain readable.

Each saved quote gains four private decision aids:

- a short private note, capped at 240 characters;
- a visited flag;
- a contract-candidate flag;
- four user-controlled checks: registry/owner, deposit protection, management-fee breakdown, and understood contract terms.

The comparison shows the note, visit state, candidate state, and checklist completion as `n/4 checked`. It must explicitly say this is a completion tracker, not legal verification or a risk score. Contract candidates sort before favorites, then the existing known-monthly-cost order applies.

The existing private Rent Check recheck handoff remains the implementation. Exact prices stay in short-lived session storage and never enter the URL or analytics.

## Localized UX

English and Simplified Chinese saved-home cards expose a compact decision editor. The editor saves all decision fields together and uses native labels, checkboxes, a bounded textarea, and a 44px save target. Comparison rows and explanatory copy are localized in both pages.

Analytics may emit `saved_quote_decision_updated` with only language and the existing saved-count bucket. Notes, checklist values, home IDs, prices, districts, and candidate state are not sent.

## Sheet storage fix

The Apps Script must write `privacy_notice_version` as plain text in both `Leads` and `Experiences`. It must set the target cell to text format before writing the submission row so a value such as `2026-08-28` is not auto-converted to a Google Sheets date serial. Header behavior, email upsert, report-ID deduplication, formula neutralization, and notifications remain unchanged.

## Verification

- Use red-green tests for Sheets coercion, storage migration, decision updates, sort priority, and checklist progress.
- Run saved-home and Apps Script focused tests, JavaScript syntax checks, then the full `node --test` suite.
- Verify English and Chinese saved-home flows at desktop and mobile widths before production release.

