# Experience Capture MVP Design

## Goal

Collect a small, structured, self-reported rental experience after a completed Rent Check without publishing names, addresses, agencies, or individual reports. The first release stores private responses only; no public aggregation ships until response quality and sample size are reviewed.

## User flow

After `khg:rent-check-result`, a low-priority teaser appears below the saved-home action on all four Rent Check surfaces: English and Chinese home, plus English and Chinese standalone tools. Opening it replaces the teaser in place with a short form.

The form shows the prefilled district and property type and asks for:

- brokerage fee paid, optional, explicitly excluding VAT and separate service charges;
- one required, mutually exclusive deposit outcome: `returned_on_time`, `returned_late`, `returned_with_deductions`, `not_returned_after_moveout`, or `still_renting`.

The successful state replaces the form. No email, name, building, address, agency, landlord, free text, or public review is requested. Copy says “No name, email, agency, or address required” rather than claiming absolute anonymity.

## Calculation rules

The result event already supplies district, saved property type, deposit, monthly rent, and floor area. These values accompany the report even though only the fee and outcome require new user input.

The server calculates a brokerage ceiling; it never accepts a client-computed ceiling. Apartment, villa, detached/multi-unit, and studio values use the housing rule. An officetel report is stored with `cap_status=undetermined` and no legal ceiling because the Rent Check flow cannot verify all statutory facility conditions. A fee is compared only when a ceiling is determinable. Stored rows retain the source deposit, rent, area, calculation status, and rule version so future audits do not depend on a derived number alone.

Public wording is reserved for a later release and must use “reported fee above our calculated brokerage ceiling,” “self-reported,” and “not verified.”

## Backend and storage

Keep the existing `POST /api/lead` endpoint to avoid adding a Vercel Function. Route `kind=experience_report` through a dedicated `normalizeExperiencePayload()` in `lib/experience-report.cjs`; existing lead and help validation remains unchanged.

The normalized report includes a bounded client-generated report ID for idempotency, locale, district, property type, quote values, reported fee, deposit outcome, computed ceiling/status, source page, rule version, privacy notice version, and creation timestamp.

The Apps Script routes experience rows to a separate `Experiences` sheet with a fixed schema. It deduplicates by report ID and does not send owner email notifications for reports. Existing lead upsert and notification behavior remains unchanged.

## Abuse and privacy controls

The browser persists a successful context fingerprint and does not offer the same report again. Apps Script deduplicates the report ID. The existing production `/api/lead` IP rate-limit rule must be verified before launch; raw IP addresses are not forwarded to Sheets. These controls limit casual duplication but do not claim identity verification.

The privacy notice is linked beside the submit action. The payload records its version. Data collection follows the minimum-data principle and excludes direct identifiers.

## Analytics

- `experience_prompt_shown`: `language`
- `experience_form_opened`: `language`
- `experience_submitted`: `language`, `district_code`, `property_type`, `deposit_outcome`, `has_fee`

Events contain no report ID, money amounts, email, address, free text, or source URL query values. Submission analytics fires only after a successful server response.

## Release boundary

This release does not add aggregate API responses, public percentages, market-page blocks, moderation tooling, international schemas, or free text. Public aggregation requires a separate approval after at least 20 valid responses in a cohort and a review of self-selection and data quality.

## Verification

- Unit tests cover validation, calculation, officetel indeterminacy, idempotency, and Apps Script routing.
- Frontend tests cover four-page loading, localized copy, mutually exclusive outcomes, safe analytics, and successful/failed UI states.
- The complete repository test suite passes.
- Production is checked on all four Rent Check surfaces after the GitHub main deployment reaches `READY`.
