# Data model: the `market` and `dealType` axes

The goal is that adding Seoul-sale, or Singapore, or Paris later is **an adapter
file**, not a rewrite. Two axes are missing from the current model, and adding
them is cheap today and expensive after another few months of Seoul-shaped code.

This is a refactor, not a V2. `providers/` is already an adapter layer; it is
missing two parameters and a cost abstraction.

## What is already there — build on it, do not replace it

- `providers/korea-provider.cjs` — a real adapter, with a per-district row cache
  (`rowsFor`) every method reads. The caching shape is right; keep it.
- `providers/provider-utils.cjs` — `aggregateDongs`, `aggregateBuildings`,
  `buildBuildingDetail`, `normalizeTransaction`. Market-neutral in structure,
  Seoul-specific only in the field names it expects.
- `lib/real-price-core.cjs` — **already has `fetchSaleMonth`**, and
  `korea-provider` already calls it via `saleRowsFor` for apartment detail.
  Sale data is half-wired for Korea today. Seoul-sale is therefore the cheapest
  possible second product.
- `deposit-conversion.js` — the deposit↔rent lever, already single-sourced.

## Axis 1 — `market`

A market is one city/metro with **one data source, one place hierarchy, one set
of rules**. Not a country: Seoul and Busan would be separate markets even though
both are MOLIT.

```
seoul | singapore | dubai | paris | london | taipei
```

Every call that currently assumes Seoul takes `market`. Today:

```js
provider.getBuildings({ areaCode, propertyType, dong, months })
```

Target:

```js
provider.getBuildings({ market, dealType, area, propertyType, months })
```

`areaCode`/`dong` become market-specific values inside a generic `area` path —
Seoul passes a district code plus a dong, Singapore passes a planning area,
Dubai passes a community. The **caller must never construct these**; only the
adapter and the route layer know their shape.

## Axis 2 — `dealType`

```
rent | sale
```

Not a property type and not a mode flag — a facet of the same place. The same
building has both, and a building page should be able to show both.

## The cost model — the part that actually generalises

This is where a naive design fails. The price components are not the same shape
in any two markets:

| Market | Deal | Native shape |
|---|---|---|
| Seoul | rent | deposit + monthly rent, and they trade against each other |
| Seoul | sale | one amount |
| Singapore | rent | monthly rent, deposit fixed by lease length, + agent fee + stamp duty |
| Dubai | rent | annual rent split into 1–4 cheques; fewer cheques, lower total |
| Paris | sale | one amount |

So do not model "deposit" and "monthly rent". Model **upfront versus
recurring**, which is what every one of them actually is:

```js
{
  currency: 'KRW',              // ISO 4217
  upfrontRefundable: 20000000,  // KR deposit, SG deposit — comes back
  upfrontSunk: 990000,          // agency fee, stamp duty — does not
  recurringMonthly: 750000,     // 0 for a sale
  oneOffTotal: null,            // sale price; null for a rent
  native: { ... }               // the market's own fields, untouched
}
```

`native` matters: keep the raw market shape so a market page can still say
"보증금 2,000만 / 월 75만" or "4 cheques" in its own vocabulary. The common
envelope is for comparison, not for display.

### The lever

Each adapter supplies how upfront trades against recurring. This is the
generalisation of `monthlyRentAtDeposit`:

```js
adapter.restateAtUpfront(cost, targetUpfrontRefundable) -> cost
```

- **Seoul** — the 5.0% statutory conversion in `deposit-conversion.js`.
- **Dubai** — the cheque-count discount curve.
- **Singapore** — returns the cost unchanged; there is no lever, and saying so
  explicitly is better than pretending there is one.

Everything the product does across cities — "cash on day one", the map coloured
by your cash, the comparison table — is this one function plus the envelope.

## Money: integers and a currency, never floats

Current code carries bare numbers named `...Won`. KRW has no minor unit so this
works by accident. **SGD, AED, EUR and GBP have cents**, and float arithmetic on
money will produce wrong medians and wrong conversions.

Store **integer minor units** (KRW: won; SGD: cents) plus the currency code, and
format at the edge. Fixing this after a second currency is live means touching
every aggregate. Fixing it now is a rename.

## Area: normalise, keep the native unit

Store `areaSqm` as the comparison field; keep the market's native unit for
display (㎡, 평, sqft). Singapore listings are commonly sqft; Dubai too.
`rent-check-size.js` already does the 평 toggle — same pattern, one level up.

## URLs — do not break the indexed ones

Current: `/seoul/{district}/{dong}/{type}/{building}/`, plus `/zh/...`.
Roughly 800 building pages and the dong pages were only just made indexable.

Target: `/{market}/{dealType}/{...place}/{type}/{building}/`

**Requirement: every existing URL 301s to its new form.** Write the mapping
table before changing any route, and keep `rent` as the default so Seoul rental
URLs can stay short if that is preferred. A migration that loses the indexed
building pages costs more than the whole refactor saves.

`seo/seo-route-utils.cjs` already has the reversible slug (`{readable}-{hash7}`,
hash is the identity), so building URLs survive a readable-half change. Extend
the same idea to the place path rather than inventing a second scheme.

## Order of work

1. **Cost envelope + integer money** in `provider-utils.cjs`. No behaviour
   change; Seoul rent still renders identically. This is the load-bearing step.
2. **`dealType` through the adapter**, defaulting to `rent`. Seoul sale then
   lights up using the `fetchSaleMonth` that already exists — same source, same
   adapter, different facet. **This is the test of whether the axes are right,
   at the lowest possible cost.**
3. **`market` through the adapter and the route layer**, with the 301 map.
   Seoul is still the only market; nothing user-visible changes.
4. **A second market** (Singapore — cleanest API of the three) as one new
   adapter file. If step 4 needs changes anywhere outside
   `providers/singapore-*.cjs` and a config entry, the axes were wrong and the
   place to fix them is here, not later.

Do steps 1–3 before any second market. If Seoul-sale needs edits outside the
adapter, that is the signal to stop and fix the model.

## Non-negotiables

- No market name, currency, or unit hardcoded outside `providers/` and the
  market config.
- No float money.
- The lever is adapter-supplied. Nothing outside an adapter may assume a
  deposit↔rent relationship exists.
- Every existing indexed URL keeps working.
- A market with no rights to publish detail pages (URA detail, DLD commercial)
  ships aggregates only and generates no indexable detail URLs — enforce this in
  the market config, not in page code.
