KoreaHomeGuide — Cold Start Funnel patch
Date: 2026-08-25

UPLOAD
------
Upload the CONTENTS of this folder to the repository root, preserving paths.

WHAT CHANGES
------------
1. Homepage becomes a single acquisition funnel
   Visitor -> Rent Check -> complete result -> email lead -> optional help request.

2. Rent Check remains neutral
   - Full result and comparable contracts appear BEFORE the email form.
   - No affiliate, referral, sponsored, or paid-placement logic is added.

3. Shared lead capture
   - EN and Simplified Chinese.
   - Home + standalone Rent Check use the same /lead-capture.js.
   - Japanese is intentionally NOT shipped yet.

4. New POST /api/lead
   - Validates email / locale / district / property type / amounts / area.
   - 16 KB body ceiling.
   - Same-origin production source guard.
   - PII-safe server logging.
   - no-store response caching.

5. Google Sheet lightweight CRM
   Browser -> /api/lead -> Google Apps Script -> Google Sheet.
   Webhook URL and secret stay server-side.
   Apps Script:
   - validates a shared secret
   - prevents spreadsheet formula injection
   - serializes writes with LockService
   - appends a fixed lead schema.

6. GA4 funnel events, without PII
   - rent_check_start
   - rent_check_result
   - lead_form_view
   - lead_submit
   - help_request

7. v12 moving/commerce experiment
   Its source files are NOT deleted.
   Moving / SIM / internet / cleaning / insurance / relocation "Coming soon"
   cards are simply removed from primary homepage attention during Cold Start.

REQUIRED AFTER UPLOAD
---------------------
Lead storage will NOT work until Google Sheet / Apps Script is configured.

Follow:
docs/operations/google-sheet-lead-capture.md

Required Vercel environment variables:
- LEAD_SHEET_WEBHOOK_URL
- LEAD_SHEET_SHARED_SECRET

No real secret or real webhook URL is included in this patch.

EMAIL DELIVERY
--------------
This patch captures leads in the Sheet, but does NOT implement automated outbound
email delivery. The UI therefore does not falsely claim that a report was emailed.

VERIFICATION
------------
Fresh isolated verification performed before packaging:
- Core Cold Start + locally reproducible compatibility suite: 51/51 passed.
- Updated homepage-only compatibility subsets: 6/6 passed.
- Modified JS/CJS syntax checks: passed.
- Apps Script syntax check through a temporary .js copy: passed.
- Browser files contain no Sheet webhook URL or shared secret.
- Funnel files contain no Wise / affiliate / referral / sponsored / commission CTA.
- GA tracking sources contain no email/help-message parameter.
- No Japanese site tree is included.

LIMITATION
----------
A full repository checkout cannot be created in this environment because outbound
git clone/network access is blocked. Therefore the entire GitHub test suite was not
run here. Existing tests whose assertions intentionally conflicted with the approved
homepage strategy are included with updated expectations. After the user uploads the
patch, run the repository's normal full test suite / deployment build before treating
production as verified.
