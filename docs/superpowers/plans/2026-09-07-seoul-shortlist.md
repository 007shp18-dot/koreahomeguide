# Seoul saved-search implementation

Approved scope: budget, district and exact net-area search over recent published apartment sale records; browser-local conditions and up to 30 saved buildings; on-visit refresh and newly observed record indicators. English and Korean. No account, email delivery, listing availability or background job.

- [x] Use the existing verified sale repository and preserve publication gating.
- [x] Expose a bounded, validated GET endpoint (24 candidates/page, 30 saved IDs).
- [x] Match the last three months of the installed release within up to 20 recent rows per building. Disclose the sample limit and source dates.
- [x] Persist conditions and signature multisets in browser storage with a session-only fallback on write failure.
- [x] Show changed records without calling corrections or same-month duplicates confirmed new contracts; keep a user-controlled acknowledgement baseline.
- [x] Add a separate tool linked from the existing Explore heading, preserving navigation and branding.
- [x] Verify exact price/area boundaries, withheld data, pagination, missing records, duplicate signatures, malformed storage and real installed evidence.
- [ ] Verify save/reload/update flow in a browser and deploy the reviewed change.
