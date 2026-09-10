# KoreaHomeGuide API protection

The application-level hardening in this release does the following:

- limits public MOLIT-backed APIs to the supported Seoul district codes and property types;
- limits `/api/real-prices` to the latest 60 completed months;
- rejects explicit cross-origin browser calls and, in Vercel production, rejects direct headerless calls unless browser fetch metadata identifies a same-origin/same-site request;
- aborts data.go.kr requests after 5 seconds;
- logs safe failure context to Vercel without logging the service key or upstream URL;
- caches the Seoul-wide Explorer response for six hours and bounds its cold-cache upstream concurrency.

## Remaining platform-level rate limit

Do not implement a global IP rate limit with a module-level JavaScript `Map`: Vercel Functions can run in multiple instances, so that would not provide a reliable shared limit.

Configure shared IP rate limiting in the Vercel Firewall after deployment. Suggested starting limits:

- `/api/explore-seoul`: 5 requests/minute/IP
- `/api/rent-check`: 10 requests/minute/IP
- `/api/real-prices`, `/api/rent-market`, `/api/explore-area`, `/api/explore-dong`, `/api/explore-building`: 30 requests/minute/IP

Watch legitimate 429s and data.go.kr quota usage, then adjust. The code-level request-source checks are defense in depth, not a substitute for a shared firewall rate limit because HTTP headers can be spoofed by a server-side caller.
