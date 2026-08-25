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

Run one Rent Check, submit an email lead, and confirm exactly one new row appears in the `Leads` tab. Then submit the optional help form and confirm a second row with `kind=help_request` and `help_requested=true`.

If the webhook is unavailable, Rent Check must continue to show its normal result. Only the lead form should show a temporary storage error.
