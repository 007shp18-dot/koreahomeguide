# City buying decisions and consultation implementation

Goal: extend the approved four-city journey with useful city context, four budget comparisons and an honest purchase-enquiry handoff.

Architecture: reuse published transaction evidence and existing overview/article/contact routes. Keep the enquiry draft in browser memory; open the existing official email address with user-reviewed content. No new database, mail provider, identity collection or claimed brokerage appointment.

Constraints: original blue semantic controls; EN/KO/ZH content; preserve existing evidence routes, release IDs and index policy. Budget examples are historical. User requested minimal tokens and focused validation; work inline, no redundant test cycles.

- [ ] Publish a compact audited Tokyo snapshot: 2026 Q1, condo records, 80–100% of each cap, ward +20m² bands, minimum5 records, highest-count band per ward, top5 distinct wards. Keep query evidence with snapshot.
- [ ] Add one comparative budget article per city, in all3 locales, using existing reviewed examples and new Tokyo ward groups. Show costs/checks and links to evidence, overview and contact.
- [ ] Insert a shared city decision section before overview statistics: why consider it, tradeoffs, budget entry, comparison article and enquiry. Preserve source/fact panels.
- [ ] Add a localized consultation form to contact: city, budget, purpose, timeline and optional context; safe query-prefill for city/budget only. Clear email-draft status and copy fallback. No automatic send or fake success.
- [ ] Add home and article handoffs. Test Tokyo minimum-count/diversity/budget bounds, contact context/reset/encoding and locale destinations. Run typecheck and focused tests once, then required hostedCI; investigate only failures.
- [ ] Commit, PR, publish after required checks and verify live handoff without sending a message.
