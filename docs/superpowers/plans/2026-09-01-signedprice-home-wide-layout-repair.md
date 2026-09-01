# SignedPrice Homepage Wide Layout Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the SignedPrice homepage hero at wide desktop widths so the headline, description, intent tabs, and search remain readable in the first viewport.

**Architecture:** Keep the approved two-column evidence-editorial hero. Replace viewport-derived padding on both sides of the left grid cell with an outer alignment margin on the physical left and a bounded content gutter on the physical right; add a source-level regression contract and verify the rendered Production layout.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, CSS Modules, Vitest, browser verification

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-unified-market-explorer-v2-design.md`

## Global Constraints

- Keep the existing two-column hero and all public content.
- Do not change evidence counts or market availability.
- Keep a 40-pixel minimum desktop outer gutter and 20-pixel mobile gutter.
- The right content gutter must not grow from `100vw`.
- Preserve the existing `980px` and `760px` responsive transitions.
- No new dependency.

---

### Task 1: Lock the wide-layout regression

**Files:**
- Modify: `v2/apps/web/test/home-layout.test.ts`
- Modify: `v2/apps/web/components/home-editorial.module.css`

**Interfaces:**
- Consumes: raw `home-editorial.module.css` source.
- Produces: `.heroCopy` with separate block, left, and right padding declarations.

- [ ] **Step 1: Write the failing test**

Add a test that reads the CSS module and asserts the wide hero uses `padding-left: max(40px, calc((100vw - var(--site-width)) / 2))`, a bounded `padding-right: clamp(40px, 5vw, 80px)`, and no symmetric `padding` declaration containing the viewport-derived outer margin.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `pnpm vitest run apps/web/test/home-layout.test.ts`

Expected: failure because `.heroCopy` currently applies the viewport-derived value to both inline sides.

- [ ] **Step 3: Apply the minimal CSS repair**

Use:

```css
.heroCopy {
  padding-block: clamp(44px, 6vw, 88px);
  padding-left: max(40px, calc((100vw - var(--site-width)) / 2));
  padding-right: clamp(40px, 5vw, 80px);
}
```

- [ ] **Step 4: Run the focused test and confirm pass**

Run: `pnpm vitest run apps/web/test/home-layout.test.ts`

Expected: all homepage layout tests pass.

- [ ] **Step 5: Commit**

```bash
git add v2/apps/web/test/home-layout.test.ts v2/apps/web/components/home-editorial.module.css docs/superpowers/plans/2026-09-01-signedprice-home-wide-layout-repair.md
git commit -m "fix(home): restore wide hero layout"
```

### Task 2: Verify the complete homepage and release candidate

**Files:**
- Verify: `v2/apps/web/components/home-market-browser.tsx`
- Verify: `v2/apps/web/components/home-editorial.module.css`

**Interfaces:**
- Consumes: the repaired CSS module and existing homepage route.
- Produces: a verified release candidate with no layout or runtime regression.

- [ ] **Step 1: Run repository gates**

Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` from `v2/`.

Expected: every command exits zero.

- [ ] **Step 2: Verify responsive browser geometry**

At 390, 720, 1366, and 2048 CSS pixels, confirm the shared header and city tabs are reachable, the root has no horizontal overflow, the headline is not squeezed by a viewport-derived right gutter, and the Rent search is reachable without layout collision.

- [ ] **Step 3: Verify runtime behavior**

Confirm Seoul, Singapore, and Dubai tabs remain interactive; Rent, Buy, and Invest controls preserve their availability states; and no console error or 5xx response occurs.

- [ ] **Step 4: Push and deploy the exact reviewed SHA**

Push the feature branch, merge through the repository workflow, deploy the resulting exact Production SHA, then repeat the homepage geometry and runtime checks on `https://www.signedprice.com/`.
