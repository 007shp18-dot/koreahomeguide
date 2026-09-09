# SignedPrice internal evidence workspace

The user approved the preceding in-chat design and requested implementation including the internal management UI. This is a new subsystem, not a public-site redesign.

## Scope

Add `/admin/evidence/` in a separate Korean root layout without public analytics. Operators sign in using the existing server-only `CONTENT_ADMIN_SECRET`; the server issues an eight-hour signed HttpOnly, SameSite=Strict session cookie. Every data request authenticates on the server, mutations require same origin, and no secret is stored in browser storage. Require a secret of at least 32 characters. Rotating it invalidates sessions. This is shared-operator authentication, not individually identified staff accounts.

Provide overview counts, server-filtered paginated evidence, source registration/review, structured evidence registration/correction/review/withdrawal, and chronological history. Source approval is distinct from evidence approval. Approved source plus approved, unexpired evidence is necessary for analysis readiness; community reports are qualitative leads, never verified price evidence. Show missing building/area/size inputs without calculating unsupported returns.

## Storage and boundaries

Append migration `0020_property_evidence_pool.sql`: sources, evidence, audit events. Reuse existing Neon HTTP client and migration runner. All values use parameterized SQL. Mutations and audit insertion are one atomic statement. Version checks reject stale review/correction; corrections return records to pending review. Withdrawn records cannot be resurrected. Source withdrawal immediately invalidates its records' analysis readiness. Expiry is evaluated on read, never silently reactivated. Exact duplicate evidence fingerprints conflict, including withdrawn rows.

Store only structured values, source URLs, controlled categories, and short operator-authored labels/review reasons. Do not accept raw post, comment, or author fields. Reject unknown fields and credential-bearing/non-HTTPS URLs. No URL fetching, scrapers, attachments, public publication, fabricated examples, or social analytics are part of this slice.

## Delivery and validation

Implement in a feature branch. Test contracts, session tampering/expiry, authorization and origin rejection, atomic persistence behavior, and rendered empty/error/review states. Type-check and compile with production database variables unset. Do not execute production migrations or deploy on an implementation-only request. Supply activation instructions for DB migration, secret configuration, and `/admin/evidence/` after deployment. No claim of live operation without verifying deployment.
