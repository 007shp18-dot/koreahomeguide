# Google Sheet lead capture setup

KoreaHomeGuide stores early Rent Check leads and private structured rental experiences in Google Sheets through a server-to-server Apps Script webhook.

## 1. Create the Sheet

Create a Google Sheet for early leads. The Apps Script creates or uses two fixed-schema tabs: `Leads` for email/help requests and `Experiences` for `experience_report` submissions. It adds each header row automatically when that tab is empty.

## 2. Add the Apps Script

Open **Extensions → Apps Script** from the Sheet and paste the contents of:

`ops/google-apps-script/lead-webhook.gs`

When this repository file changes, paste the new version and create a new Web App deployment. Updating GitHub or Vercel does not update the Apps Script deployment automatically. The August 27, 2026 lead schema adds `privacy_consent` and `privacy_notice_version` at the end of each row so older columns remain aligned. The August 28 experience schema is isolated in `Experiences`, keyed by `report_id`, and must be deployed before enabling the public experience form.

In **Project Settings → Script Properties**, add:

- `LEAD_SHARED_SECRET`: a long random secret
- `LEAD_SHEET_ID`: the spreadsheet ID from the Google Sheet URL
- `LEAD_NOTIFICATION_EMAIL`: the owner email that should receive a minimal new-lead alert

The notification contains the submitted email, language, district, property type, source page and a link to the Sheet. It deliberately excludes exact quote amounts and the optional help message. A notification failure never rolls back a lead that was already saved, and repeated duplicate lead submissions do not trigger another alert.

An `experience_report` does not contain an email address and does not send an owner notification. Review the `Experiences` tab directly instead.

## 3. Deploy as a Web App

Create a Web App deployment that executes as the Sheet owner. Keep the shared-secret check enabled even if the deployment URL is technically reachable from the internet.

Copy the Web App execution URL ending in `/exec`.

## 4. Configure Vercel

Add these server-side environment variables to the KoreaHomeGuide Vercel project:

- `LEAD_SHEET_WEBHOOK_URL`: the Apps Script `/exec` URL
- `LEAD_SHEET_SHARED_SECRET`: the exact same value used for Apps Script `LEAD_SHARED_SECRET`

Do not put either value in browser JavaScript, HTML, GA4, or a public repository file.

Redeploy production after setting the variables.

## 5. Verify

Run one Rent Check, agree to the point-of-collection privacy notice, submit an email lead, and confirm exactly one new row appears in the `Leads` tab. Confirm that `privacy_consent=true` and `privacy_notice_version=2026-08-27` are present. Submit the same address again with different capitalization or surrounding spaces and confirm that no second row is created. Then submit the optional help form and confirm the existing row changes to `kind=help_request`, `help_requested=true`, and receives an `updated_at` value.

Before enabling the public experience form, submit one controlled `experience_report` and confirm exactly one row appears in `Experiences`, not `Leads`. Confirm its `report_id`, `privacy_consent=true`, and `privacy_notice_version=2026-08-28`. Repeat the same report and confirm it is deduplicated. Verify that no notification email is sent for either request, then delete the controlled row.

Confirm that the owner receives one minimal lead alert for the new row, no second alert for the duplicate submission, and a separate alert for the help request. Check the Apps Script execution log if the row is saved but the alert is missing; mail quota or an invalid `LEAD_NOTIFICATION_EMAIL` must not turn a successful Sheet write into a visitor-facing error.

The normalized lowercase email is the unique lead key. A later help request enriches the original row so each person remains a single record. Do not remove the script lock: it prevents simultaneous submissions from racing into duplicate rows.

## 6. Retention and deletion

Keep lead and experience rows for no longer than 12 months unless a shorter legal or operational period applies. Review and delete expired rows monthly. For access, correction, or deletion requests sent to `hello@koreahomeguide.com`, locate a lead by normalized email or an experience by `report_id`, remove the row, and document only the completion date outside the sheet.

If the webhook is unavailable, Rent Check must continue to show its normal result. Only the lead form should show a temporary storage error.
