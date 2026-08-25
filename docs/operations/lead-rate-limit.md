# Lead endpoint rate limit

Protect `POST /api/lead` at Vercel's edge before the serverless function or Google Apps Script runs.

## Production rule

- Name: `lead-post-per-ip`
- Scope: Production
- Conditions: request path equals `/api/lead` and request method equals `POST`
- Rate limit key: client IP
- Limit: 10 requests
- Window: 1 hour
- Action: Rate Limit / return HTTP 429

In the Vercel project, open **Firewall → Configure → Custom Rules**, create the rule above, publish it, and leave the existing application-level Origin validation enabled. The Origin check is defense in depth, not a replacement for the IP limit.

## Verification

1. Use a preview or controlled test source and send 10 valid `POST /api/lead` requests.
2. Confirm the 11th request receives HTTP 429 and does not create or update a Sheet row.
3. Confirm a normal Rent Check still works because only the lead path and POST method are limited.
4. In Vercel Firewall logs, verify the rule name, path, method, and rate-limit action.
5. After the one-hour window, confirm a new request succeeds.

Do not log request bodies or email addresses in the firewall rule. Review 429 counts after launch; increase the threshold only when verified legitimate users are blocked.

Reference: [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
