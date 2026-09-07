# HDB Check and Seoul display names

**Goal:** Activate existing HDB transaction comparison with official rows and expand readable Seoul labels.

**Architecture:** Reuse the strict HDB CSV parsers and Check builders. Install digest-verified artifacts through the existing registry, retaining completed-month and minimum-comparable gates. Display aliases never change source identities or map queries.

**Scope:** No homepage changes, new data APIs, or database writes.

- [x] Download the official resale, rental and property datasets.
- [x] Verify installed HDB artifacts yield real comparable results and exclude September 2026.
- [x] Add a reproducible CSV installer with source hashes; include both artifacts in Next tracing.
- [x] Extend explicit neighborhood and estate display aliases; preserve unknown names and Korean labels.
- [ ] Run focused repository, route, tracing and display checks, then the release gate.
- [ ] Review the diff and publish through a separate pull request.

**Validation:** The installed-data integration test must fail before installation and return a ready result for both HDB markets afterwards. Existing malformed-source tests must continue to fail closed. Compare parsed CSV counts against artifact counts plus excluded current-month rows. Keep English aliases reversible and exact-name based.
