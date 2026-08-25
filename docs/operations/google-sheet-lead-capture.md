# Google Sheet lead capture setup

KoreaHomeGuide Phase 1 stores early Rent Check leads in Google Sheets through a server-to-server Apps Script webhook.

## 1. Create the Sheet

Create a Google Sheet for early leads. The Apps Script will create or use a tab named `Leads` and add the fixed header row automatically when the sheet is empty.

## 2. Add the Apps Script

Open **Extensions → Apps Script** from the Sheet and paste the contents of:

`ops/google-apps-script/lead-webhook.gs`

In **Project Settings → Script Properties**, add:

- `LEAD_SHARED_SECRET`: a long random secret
- `LEAD_SHEET_ID`: the spreadsheet ID from the Google Sheet URL

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

Run one Rent Check, submit an email lead, and confirm exactly one new row appears in the `Leads` tab. Submit the same address again with different capitalization or surrounding spaces and confirm that no second row is created. Then submit the optional help form and confirm the existing row changes to `kind=help_request`, `help_requested=true`, and receives an `updated_at` value.

The normalized lowercase email is the unique lead key. A later help request enriches the original row so each person remains a single record. Do not remove the script lock: it prevents simultaneous submissions from racing into duplicate rows.

## 6. Retention and deletion

Keep lead rows for no longer than 12 months unless a shorter legal or operational period applies. Review and delete expired rows monthly. For access, correction, or deletion requests sent to `hello@koreahomeguide.com`, locate the normalized email, remove the row, and document only the completion date outside the lead sheet.

If the webhook is unavailable, Rent Check must continue to show its normal result. Only the lead form should show a temporary storage error.
