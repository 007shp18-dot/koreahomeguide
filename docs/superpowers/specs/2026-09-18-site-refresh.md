# SignedPrice public interface refresh

Approved in the conversation on 2026-09-18: implement the full public-site redesign, including detail pages and mobile. This is an interface renovation of the existing product, not a replacement data platform.

## Design
White backgrounds, established blue accent #2563d8, restrained photo-led introductions, clear hierarchy and compact evidence workspaces. Home gets working city search and a four-city photographic composition. Existing budget journey and actual editorial reports remain. City overviews use a light split photo layout. Explore and ranking prioritize controls/results; property details keep evidence, source and scope visible. Guides/articles prioritize reading. Tools, saved, About, contact and trust use the same type/control/surface system. Use the existing licensed photos with their credits; never use generated mockup data or substitute building photos.

## Invariants
Preserve current routes, metadata, locale prefixes, English/Korean/Simplified Chinese, data access, consent, API boundaries, currencies, source periods, price calculations, filters, pagination, saving and request submission. City order: Seoul, Singapore, Dubai, Tokyo. Control height 48px; touch targets at least 44px; input text 16px. Missing/failed/empty data remain distinct from zero. No new dependencies, sign-in, community expansion, paid assets, copied proprietary component code, analytics changes or database migrations. Administrative pages remain unchanged.

## Verification
Failing then passing browser test of actual server-rendered homepage. Desktop/mobile screenshots and no-overflow checks across public page families. Exercise real search submission, existing budget selection and calculator behavior, native disclosure/keyboard control and reduced motion. Run existing lint/type/unit/production build and existing UI regression tests. Keep work on an isolated branch until verified. Report exact verified coverage and unresolved failures; no claim of production deployment until the deployment is ready.
