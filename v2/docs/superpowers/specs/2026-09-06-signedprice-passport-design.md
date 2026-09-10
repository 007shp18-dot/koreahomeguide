# SignedPrice Passport v1 design

## Outcome

Make the first home-screen action a single KRW budget entry that leads to a shareable, evidence-backed comparison of Seoul, Singapore, and Dubai.

## Product boundary

- Cash budget only in v1.
- Convert one KRW amount with a dated reference FX snapshot.
- Compare released sale evidence; never imply that a transaction is an available listing.
- Show buyer taxes, financing, remittance spreads, and nationality-specific eligibility as excluded.
- Keep source period, sample, and limitations visible.

## Experience

The home hero presents the question, a formatted KRW input, and one comparison action before the existing market browser. The result route uses three equal-height cards with identical rows: local budget, indicative area at observed unit price, matching released markets, evidence period, and next action. The query parameter `budget` is the complete share state.

## Data method

- Seoul: published MOLIT apartment sale cohorts and recent reported sales.
- Singapore: published URA private-residential project summaries; unit price is converted from PSF to PSM.
- Dubai: published Dubai Land Department Ready residential area aggregates, with yield shown only where released.
- FX: frozen official reference snapshot dated 2026-09-04; it is informational and not a transfer quote.

## Routes and localization

- English: `/passport/?budget=500000000`
- Korean: `/ko/passport/?budget=500000000`
- Simplified Chinese: `/zh-cn/passport/?budget=500000000`

The three routes share one model and component. The home and Tools hub link to the locale-matched route.

## Failure behavior

Invalid budgets fall back to KRW 500,000,000. If one evidence repository is unavailable, that card remains in the same grid slot and explains that evidence is unavailable; other markets still render.

