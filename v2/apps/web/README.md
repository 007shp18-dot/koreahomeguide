# signedprice web

This Next.js application is the `@signedprice/web` package in the pinned pnpm
workspace under `v2/`. Shared market contracts come from
`@signedprice/market-core`; install and run the complete local gate from the
workspace root.

## Local workspace commands

From the repository root:

```bash
cd v2
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Start the local development server from `v2/` with:

```bash
pnpm --filter @signedprice/web dev
```

The browser release contract is available through `pnpm e2e`; it requires the
lockfile-resolved Playwright Chromium runtime to already be installed.

## Preview project root

The independent signedprice Vercel Preview project uses `v2/apps/web` as its
Root Directory. Enable **Include source files outside of the Root Directory in
the Build Step** so the app can resolve the workspace lockfile and
`@signedprice/market-core` package above the app root.

Verify that root configuration locally from the repository root:

```bash
pnpm --dir v2/apps/web install --frozen-lockfile
pnpm --dir v2/apps/web build
```

Remote Preview creation and deployment require separate authorization. Follow
the [Phase 1 Preview gate](../../../docs/operations/signedprice-v2-phase-1-preview-gate.md)
without modifying the legacy KoreaHomeGuide project, attaching a domain, or
promoting to Production.
