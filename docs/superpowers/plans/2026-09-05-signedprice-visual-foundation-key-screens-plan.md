# SignedPrice Visual Foundation and Key Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish one restrained SignedPrice visual system and apply it to the public News index and Seoul building detail without changing their routes, data contracts, or primary interactions.

**Architecture:** Keep the current Next.js route and server-model boundaries. Add a small set of semantic visual tokens in the global stylesheet, then update the two reference screens through their existing CSS modules and focused markup changes. Treat the News index and building detail as the reference implementation that later Homepage, Markets, Guides, and Explore plans must reuse.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript 5.9.3, CSS Modules, Vitest, Playwright, pnpm 11.19.0

**Spec:** `docs/superpowers/specs/2026-09-05-signedprice-global-investment-visual-system-design.md`

## Global Constraints

- Preserve the existing navy, blue, and white SignedPrice palette.
- Use blue only for links, current selection, focus, and primary actions.
- Remove decorative blue lines, floating words, repeated arrows, and thick page frames.
- Main body text is at least 16px; routine UI labels are at least 14px; metadata is 12–13px; nothing public is below 12px.
- Every primary button, tab, and filter target is at least 44×44px.
- Public building hero media is 16:9 and uses only approved exact-subject media.
- A missing building photo uses a neutral unavailable state and never substitutes a city or different-building photo.
- Preserve News routes and filters, Explore return state, Check links, building evidence, photo policy, and source boundaries.
- Validate at 1440px, 1024px, and 390px before production release.
- Do not modify or deploy the legacy KoreaHomeGuide application.

## File Map

| File | Responsibility |
| --- | --- |
| `v2/apps/web/app/globals.css` | Shared semantic typography, surface, line, radius, and focus tokens |
| `v2/apps/web/components/public-market/building-visual.tsx` | Licensed-photo and missing-photo presentation |
| `v2/apps/web/components/public-market/observed-building-detail.tsx` | Legacy observed-detail branches that duplicate the missing-photo markup |
| `v2/apps/web/components/public-market/building-detail-page.tsx` | Public building hero identity hierarchy and facts semantics |
| `v2/apps/web/components/public-market/building-page.module.css` | Current routed building detail composition |
| `v2/apps/web/components/public-market/building-detail.module.css` | Shared building media and observed-detail visual states |
| `v2/apps/web/test/public-building-visual.test.tsx` | Exact photo and neutral unavailable-state behavior |
| `v2/apps/web/test/public-building-detail.test.tsx` | Building detail information and layout contract |
| `v2/apps/web/components/newsroom/newsroom-index.tsx` | Public News intro, filters, lead, and editorial rows |
| `v2/apps/web/components/newsroom/newsroom.module.css` | Public News visual hierarchy and responsive behavior |
| `v2/apps/web/test/newsroom-routes.test.tsx` | News filter, content, and markup contract |
| `v2/apps/web/test/editorial-growth-review-typography.test.ts` | Public editorial typography floor |
| `v2/tests/e2e/newsroom.spec.ts` | News route and interaction browser regression |
| `v2/tests/e2e/korea-detail.spec.ts` | Building detail and return-journey browser regression |

---

### Task 1: Shared Visual Tokens

**Files:**
- Modify: `v2/apps/web/app/globals.css`
- Modify: `v2/tests/e2e/newsroom.spec.ts`

**Interfaces:**
- Consumes: existing `--canvas`, `--surface`, `--surface-strong`, `--ink`, `--muted`, `--divider`, `--accent`, and spacing tokens
- Produces: `--page-title-size`, `--section-title-size`, `--card-title-size`, `--body-size`, `--body-leading`, `--ui-size`, `--meta-size`, `--line-subtle`, `--radius-card`, `--research-content-frame`, and `--research-reading-frame`

- [ ] **Step 1: Write the failing rendered token contract**

Add a browser assertion to `newsroom.spec.ts` that verifies the rendered News page consumes the shared values rather than checking stylesheet source text:

```ts
test('News uses the shared readable type and restrained frame', async ({ page }) => {
  await page.goto('/news/');
  const values = await page.locator('[data-newsroom-layout="research"]').evaluate((main) => {
    const root = getComputedStyle(document.documentElement);
    const heading = main.querySelector('h1');
    if (heading === null) throw new Error('News heading missing');
    return {
      bodySize: root.getPropertyValue('--body-size').trim(),
      uiSize: root.getPropertyValue('--ui-size').trim(),
      readingFrame: root.getPropertyValue('--research-reading-frame').trim(),
      headingSize: Number.parseFloat(getComputedStyle(heading).fontSize),
    };
  });
  expect(values).toEqual({ bodySize: '1rem', uiSize: '0.875rem', readingFrame: '720px', headingSize: 48 });
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
pnpm --dir v2 exec playwright test tests/e2e/newsroom.spec.ts --project=desktop-chromium
```

Expected: FAIL because the research layout marker and semantic tokens do not exist.

- [ ] **Step 3: Add the semantic tokens**

Add the following to `:root` in `globals.css`, using existing color tokens rather than adding another palette:

```css
--page-title-size: clamp(2.25rem, 4vw, 3rem);
--section-title-size: clamp(1.75rem, 3vw, 2rem);
--card-title-size: clamp(1.25rem, 2vw, 1.3125rem);
--body-size: 1rem;
--body-leading: 1.65;
--ui-size: 0.875rem;
--meta-size: 0.75rem;
--line-subtle: 1px solid var(--divider);
--radius-card: 12px;
--research-content-frame: 1200px;
--research-reading-frame: 720px;
```

Do not replace existing compatibility tokens in this task. Later tasks consume the new names only in the reference screens.

- [ ] **Step 4: Run the focused test and confirm pass**

Run:

```bash
pnpm --dir v2 exec playwright test tests/e2e/newsroom.spec.ts --project=desktop-chromium
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add v2/apps/web/app/globals.css v2/tests/e2e/newsroom.spec.ts
git commit -m "style: define restrained research visual tokens"
```

---

### Task 2: Neutral Building Photo State

**Files:**
- Modify: `v2/apps/web/components/public-market/building-visual.tsx`
- Modify: `v2/apps/web/components/public-market/observed-building-detail.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail.module.css`
- Modify: `v2/apps/web/test/public-building-visual.test.tsx`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx`

**Interfaces:**
- Consumes: `BuildingVisualModel` with `kind`, `title`, `reason`, `nextAction`, and licensed-photo fields
- Produces: missing-photo markup with `data-building-media="evidence-fallback"` or the existing observed-branch marker, `data-photo-state="unavailable"`, one title, one reason, and one next action

- [ ] **Step 1: Write failing unavailable-state tests**

Extend `public-building-visual.test.tsx`:

```ts
expect(html).toContain('data-photo-state="unavailable"');
expect(html).toContain('Building photo unavailable');
expect(html).not.toContain('Reported');
expect(html).not.toContain('Boundary shown');
expect(html).not.toContain('visualEvidenceMark');
```

Extend the observed-building coverage in `public-building-detail.test.tsx` so each no-photo branch rejects the decorative words `Reported`, `Verified`, and `Boundary shown` inside the media region.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
pnpm --dir v2/apps/web exec vitest run test/public-building-visual.test.tsx test/public-building-detail.test.tsx
```

Expected: FAIL because the three decorative labels are still rendered.

- [ ] **Step 3: Simplify the missing-photo markup**

In `building-visual.tsx`, replace `visualEvidenceMark` and the nested kicker with:

```tsx
<section
  className={styles.visualUnavailable}
  aria-label={model.title}
  data-building-media="evidence-fallback"
  data-photo-state="unavailable"
>
  <div className={styles.visualUnavailableCopy}>
    <strong>{model.title}</strong>
    <p>{model.reason}</p>
    <Link href={model.nextAction.href}>{model.nextAction.label}</Link>
  </div>
</section>
```

Apply the same one-title, one-reason, one-action structure to both duplicated missing-photo branches in `observed-building-detail.tsx`. Preserve their current data markers used by route tests and add `data-photo-state="unavailable"`.

- [ ] **Step 4: Replace the decorative CSS**

Remove `.visualEvidenceMark` rules, gradient decorations, shifted labels, dark fill, and uppercase kicker rules from `building-detail.module.css`. Use this contract:

```css
.visualUnavailable {
  aspect-ratio: 16 / 9;
  min-height: 0;
  padding: var(--space-6);
  display: grid;
  align-items: end;
  color: var(--ink);
  background: var(--surface);
}

.visualUnavailableCopy {
  max-width: 34rem;
  display: grid;
  gap: var(--space-3);
}

.visualUnavailableCopy strong {
  font-size: var(--card-title-size);
  font-weight: 600;
  line-height: 1.3;
}

.visualUnavailableCopy p {
  color: var(--muted);
  font-size: var(--body-size);
  line-height: var(--body-leading);
}
```

Keep the existing 44px action target and visible focus treatment.

- [ ] **Step 5: Run the focused tests and confirm pass**

Run:

```bash
pnpm --dir v2/apps/web exec vitest run test/public-building-visual.test.tsx test/public-building-detail.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v2/apps/web/components/public-market/building-visual.tsx v2/apps/web/components/public-market/observed-building-detail.tsx v2/apps/web/components/public-market/building-detail.module.css v2/apps/web/test/public-building-visual.test.tsx v2/apps/web/test/public-building-detail.test.tsx
git commit -m "style: simplify missing building photo states"
```

---

### Task 3: Building Detail Reference Layout

**Files:**
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/building-page.module.css`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx`
- Modify: `v2/tests/e2e/korea-detail.spec.ts`

**Interfaces:**
- Consumes: existing `PublicBuildingModel`, `BuildingDecisionModel`, `BuildingVisualModel`, `backHref`, and `createEntityCheckHref`
- Produces: unchanged route and link behavior with `data-detail-layout="research"`, a 7:5 desktop hero, semantic identity facts, and a single quiet surface hierarchy

- [ ] **Step 1: Write failing layout and content tests**

In `public-building-detail.test.tsx`, render `BuildingDetailPage` and require:

```ts
expect(html).toContain('data-detail-layout="research"');
expect(html).toContain('<dl class="');
expect(html).not.toContain('Verified building identity');
expect(html).not.toContain('Properties · Service preparing');
```

Add an end-to-end computed-style assertion to `korea-detail.spec.ts` requiring two desktop hero columns with the photo wider than the summary, a 16:9 media ratio, a one-pixel hero border, and no hero or summary-card shadow.

In `korea-detail.spec.ts`, keep the current return link and Check assertions and add visible checks for the building name before the transaction section.

- [ ] **Step 2: Run the focused component test and confirm failure**

Run:

```bash
pnpm --dir v2/apps/web exec vitest run test/public-building-detail.test.tsx
```

Expected: FAIL on the new hierarchy contract.

- [ ] **Step 3: Make identity facts semantic and reduce UI copy**

In `building-detail-page.tsx`:

- add `data-detail-layout="research"` to the main element;
- remove the `Verified building identity` eyebrow;
- replace `.identityFacts` spans with a `<dl>` containing `Property type`, `Evidence`, and `Period` terms;
- change `Properties · Service preparing` to `Listing service` and keep `Not a live listing` and its explanatory text;
- preserve the Back, Check, tab, source, news, and community links.

The facts structure is:

```tsx
<dl className={pageStyles.identityFacts}>
  <div><dt>Property type</dt><dd>{model.building.housingType}</dd></div>
  <div><dt>Evidence</dt><dd>{model.display.sampleLabel}</dd></div>
  <div><dt>Period</dt><dd>{model.evidence.period}</dd></div>
</dl>
```

- [ ] **Step 4: Apply the reference layout**

In `building-page.module.css`:

- use a flat white hero with `border: var(--line-subtle)`, `border-radius: var(--radius-card)`, and no shadow;
- place media first and summary second at desktop with `7fr / 5fr` columns;
- use 16:9 media without a blue gradient in the summary;
- render identity facts as a compact definition list separated by whitespace;
- retain the current single-column mobile order: media, identity, tabs, evidence;
- remove card shadows from summary, profile, context, and decision surfaces;
- use the shared title, body, UI, and metadata tokens.

- [ ] **Step 5: Run component tests**

Run:

```bash
pnpm --dir v2/apps/web exec vitest run test/public-building-detail.test.tsx test/public-building-visual.test.tsx test/korea-proximity-detail-route-composition.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v2/apps/web/components/public-market/building-detail-page.tsx v2/apps/web/components/public-market/building-page.module.css v2/apps/web/test/public-building-detail.test.tsx v2/tests/e2e/korea-detail.spec.ts
git commit -m "style: align building detail to research hierarchy"
```

---

### Task 4: Restrained Public News Index

**Files:**
- Modify: `v2/apps/web/components/newsroom/newsroom-index.tsx`
- Modify: `v2/apps/web/components/newsroom/newsroom.module.css`
- Modify: `v2/apps/web/test/newsroom-routes.test.tsx`
- Modify: `v2/apps/web/test/editorial-growth-review-typography.test.ts`
- Modify: `v2/tests/e2e/newsroom.spec.ts`

**Interfaces:**
- Consumes: existing `NewsroomFilters`, `PublishedContentArticle`, `PolicyRecord`, `resolveNewsroomFilters`, and canonical query URLs
- Produces: the same filter and article routes with `data-newsroom-layout="research"`, one compact filter bar, a text-led lead when no media exists, and editorial rows

- [ ] **Step 1: Write failing News structure tests**

Extend `newsroom-routes.test.tsx`:

```ts
expect(html).toContain('data-newsroom-layout="research"');
expect(html).toContain('data-newsroom-filter-bar="true"');
expect(html).toContain('<h1>News</h1>');
expect(html).not.toContain('SignedPrice Newsroom');
expect(html).not.toContain('Property change, checked against evidence.');
expect(html).not.toContain('→');
```

Extend `newsroom.spec.ts` to read computed styles for the News H1, summary, tabs, and filter links. Require a 48px desktop H1, summary text at least 16px, filter text at least 14px, and filter targets at least 44px tall.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
pnpm --dir v2/apps/web exec vitest run test/newsroom-routes.test.tsx
```

Expected: FAIL because the current hero copy, separate filter rows, arrows, and old token usage remain.

- [ ] **Step 3: Simplify the News markup**

In `newsroom-index.tsx`:

- add `data-newsroom-layout="research"` to `<main>`;
- change the intro to `News` plus `Policy changes, market releases and data stories for Seoul and Singapore.`;
- keep the Policy Tracker as a plain text link without an arrow;
- wrap the type and market navigations in `<div className={styles.filterBar} data-newsroom-filter-bar="true">`;
- remove arrows from lead and empty-state links;
- keep all canonical query construction and `aria-current` behavior unchanged.

- [ ] **Step 4: Apply the restrained News layout**

In `newsroom.module.css`:

- set the page frame to `var(--research-content-frame)` and intro padding to no more than 48px top and 40px bottom;
- set H1 to `var(--page-title-size)` with 1.08 line height;
- remove uppercase and blue from the intro label by removing the label entirely;
- place type tabs and market filters in one wrapping filter bar;
- render type tabs as underline controls and market filters as quiet secondary controls;
- reserve pill borders for the market controls only;
- reduce lead margins to 40px top and 56px bottom;
- use `var(--card-title-size)` for row headlines and `var(--body-size)` for summaries;
- preserve 44px targets, visible focus, and horizontal overflow safety on mobile.

- [ ] **Step 5: Run News tests**

Run:

```bash
pnpm --dir v2/apps/web exec vitest run test/newsroom-routes.test.tsx test/newsroom-seo.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v2/apps/web/components/newsroom/newsroom-index.tsx v2/apps/web/components/newsroom/newsroom.module.css v2/apps/web/test/newsroom-routes.test.tsx v2/tests/e2e/newsroom.spec.ts
git commit -m "style: simplify the public newsroom hierarchy"
```

---

### Task 5: Reference Screen Verification and Release Candidate

**Files:**
- Modify only if verification reveals a defect in Task 1–4 files
- Record: `v2/releases/2026-09-05-global-investment-visual-foundation.md`

**Interfaces:**
- Consumes: Tasks 1–4 commits
- Produces: a reviewable release candidate and verification record; production deployment remains a separate release action after the candidate passes

- [ ] **Step 1: Run the focused suite**

Run:

```bash
pnpm --dir v2/apps/web exec vitest run test/public-building-visual.test.tsx test/public-building-detail.test.tsx test/korea-proximity-detail-route-composition.test.tsx test/newsroom-routes.test.tsx test/newsroom-seo.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run static validation**

Run:

```bash
pnpm --dir v2/apps/web typecheck
pnpm --dir v2/apps/web lint
pnpm --dir v2/apps/web build
```

Expected: all commands exit 0. If the build reports a stale or corrupt `.next` cache, move only `v2/apps/web/.next` to a dated `/tmp` path and rerun once.

- [ ] **Step 3: Run browser regressions**

Run the existing project-supported browser suite for:

```bash
pnpm --dir v2 exec playwright test tests/e2e/newsroom.spec.ts tests/e2e/korea-detail.spec.ts
```

Expected: PASS for News filters, building detail, Check link, and Explore return journey.

- [ ] **Step 4: Inspect three viewports**

At 1440px, 1024px, and 390px inspect:

- `/news/`
- one Seoul building with an approved exact photo
- one Seoul building with no approved photo

Confirm no horizontal overflow, no text below 12px, 44px controls, 16:9 building media, neutral missing-photo state, compact News intro, one coherent filter bar, and no decorative blue line or floating label.

- [ ] **Step 5: Write the release record**

Create `v2/releases/2026-09-05-global-investment-visual-foundation.md` with:

```markdown
# Global investment visual foundation

- Scope: shared tokens, public News index, Seoul building detail
- Preserved: routes, filters, evidence, photo policy, Check and Explore return links
- Verified: focused tests, typecheck, lint, production build, browser routes
- Viewports: 1440px, 1024px, 390px
- Known limits: no new building photo acquired; Homepage, Markets, Guides, and Explore visual expansion remain in the next plan
```

- [ ] **Step 6: Commit the verification record and any proven fixes**

```bash
git add v2/releases/2026-09-05-global-investment-visual-foundation.md v2/apps/web v2/tests/e2e
git commit -m "docs: record visual foundation verification"
```

## Subsequent Plans

After this reference slice passes visual and interaction verification, create two separate plans from the same spec:

1. **Sitewide extension:** Homepage, Markets, Guides, Seoul Explore, and Singapore Explore reuse the approved reference tokens and components.
2. **Investment content:** policy tracker refinements, five infographic templates, initial English market/guide/data-story releases, and content-to-tool links.

Do not start either plan by inventing a second visual system. Their first task must import or reuse the tokens and reference components established here.
