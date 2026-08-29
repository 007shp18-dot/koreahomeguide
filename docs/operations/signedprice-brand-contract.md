# signedprice brand contract

This Phase 0 contract records the approved identity for the V2.1 migration. It
does not rebrand the legacy production pages, publish assets, purchase a domain,
or make official-data claims for Singapore or Dubai.

## Public identity

- Public brand: `signedprice` (lowercase)
- Primary domain: `signedprice.com`
- Descriptor: “Real prices. Local rules. Trusted experts.”
- Descriptor: “Real prices. Better property decisions.”
- Descriptor: “Global property intelligence and transaction network.”

## Visual tokens

| Token | Value |
| --- | --- |
| ink | `#0f172a` |
| white | `#ffffff` |
| accent | `#2563eb` |
| accent light | `#60a5fa` |
| muted | `#64748b` |

The approved logo package is represented by these asset names:

`logo-mark.svg`, `logo-mark-16.svg`, `logo-mark-inverse.svg`,
`logo-mark-mono.svg`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`,
and `og-image.svg`.

The binary logo files remain in the supplied source package. They are not copied
into the legacy public production tree during Phase 0.

## Open Graph rule

The default claim is `Property intelligence for Seoul, Singapore and Dubai`.
Market-specific pages must pass a capability-evidence gate before making a
market claim. The contract sets `requireMarketCapabilityEvidence` to `true`.

## Legal and methodology-copy audit

`audit-methodology-copy.cjs` is a deterministic, read-only scan of relevant
source copy, comments, metadata, and methodology objects. It excludes generated,
dependency, internal, worktree, Git, test, and migration-artifact paths. Findings
are reported as relative file, line, code, and excerpt in sorted order.

The audit intentionally records, rather than edits, fixed 5% conversion claims
described as statutory or legal. The current statutory-rate wording remains an
unresolved migration finding and must be reviewed before it is carried into the
signedprice product.

Regenerate the machine-readable contract and audit with:

```sh
node scripts/v2-migration/brand-contract.cjs --write artifacts/v2-migration/signedprice-brand-contract.json
node scripts/v2-migration/audit-methodology-copy.cjs --write artifacts/v2-migration/methodology-copy-audit.json
```
