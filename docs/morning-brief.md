# SignedPrice morning operations brief

The production cron runs at 23:00 UTC (08:00 Asia/Seoul the next calendar day).
Read the last 14 reports at `/admin/evidence/`, 아침 브리핑. An authenticated
administrator can generate today's report manually. One report per Korean date
is retained; repeated requests do not repeat email. Failed collection runs can
retry; abandoned runs can recover after a five-minute lease. Reports have RLS
and no public read policy. Existing migrations run through the normal build.

Required existing configuration: `DATABASE_URL`, `EVIDENCE_ADMIN_SECRET`,
`CRON_SECRET`. Generation is production-only. Cron and admin reads use separate
authentication; manual writes also require a same-origin request.

Optional email configuration (server-only production environment variables):

- `RESEND_API_KEY`: key allowed to send email.
- `MORNING_BRIEF_FROM`: sender on a verified Resend domain.
- `MORNING_BRIEF_TO`: owner's explicitly authorized email address.

Do not commit addresses or secrets. No new paid integration is provisioned.
Without all three values reports still save; email shows `not-configured`.
`accepted` means the provider accepted the message, not delivery. Unknown network
outcomes are not automatically retried, preventing duplicate email after a
crash; inspect the provider log before manual recovery. A pending record after
a crash also requires provider inspection. Completed reports are immutable.

The brief checks nine fixed public HTML routes, up to three requests at once,
10-second request timeouts and 2 MB decoded response limits. It also reads
collection failures, published DB and repository content, and the existing
reviewed headline pipeline. News covers the previous seven days, latest-first,
up to three per city. Titles are discovery evidence, not full-source analysis.
No new crawl, LLM subscription, automatic article publication or code mutation
is performed. New pages in different languages are counted as pages, not new
original articles. Missing evidence is not interpreted as a quiet market.

Single server probes do not measure real-user performance. Design, mobile
layout, calculator correctness, official policy applicability and source
completeness still need review. A finding absent today is not marked resolved:
partial collection or changed scope may explain its absence. Reports persist
in the database; the UI shows 14 days, with no automatic deletion.

Next expansion: authenticated browser screenshots and a source-grounded analyst
step with explicit model/budget configuration. Keep measurements and analyst
opinions separate, and never treat page text as instructions to execute.
