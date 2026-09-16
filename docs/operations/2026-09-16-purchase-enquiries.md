# Direct purchase enquiries

Public contact pages post to `/api/purchase-enquiries/`. A successful response means a durable record exists in Neon; it does not mean an email was delivered. The form never sends mail or opens an email app.

Operators use `/admin/#enquiries` with the existing admin session. The inbox supports new/completed filters, pagination, replying through the operator email app, marking handled requests and deleting individual enquiries. No automated notification email is configured; check this inbox for new enquiries.

The endpoint requires the existing `DATABASE_URL` and a strong `EVIDENCE_ADMIN_SECRET`. It fails closed if either is absent. Migration `0033_purchase_enquiries.sql` runs through the existing production prebuild migration runner; previews skip migrations. There are no new packages or secrets.

Same-origin JSON requests require the dated consent, valid email and bounded fields. A request UUID and canonical payload hash prevent duplicate retry records. Five new attempts per hour are allowed per keyed network identifier; raw network addresses are not retained. No personal data appears in analytics events or application error messages.

Records expire after 90 days. The existing daily `/api/internal/tool-research-expiry/` job deletes expired enquiries and expired enquiry rate-limit keys. The private inbox filters expired records even if cleanup is delayed. Restricted infrastructure backups follow their provider lifecycle.

Design reference: https://vibeprompts.dev/contact/contact-split-contact-form/ — side-by-side introduction and fields on desktop, stacked mobile layout. Existing SignedPrice tokens, colors and 48px controls are retained.
