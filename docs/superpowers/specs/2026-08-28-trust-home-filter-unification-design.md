# KoreaHomeGuide Trust, Home, and Filter Unification Design

**Date:** 2026-08-28  
**Status:** Approved direction, awaiting written-spec review  
**Scope:** English and Simplified Chinese homepages, About & Methodology pages, and district/property selectors across Home Rent Check, standalone Rent Check, and Rent Explorer

## 1. Goal

Make KoreaHomeGuide feel like an independent, deliberately edited rental-data tool rather than a repeated SaaS landing-page template. The redesign must reduce visual noise, explain why the service can be trusted without exposing the operator's identity, remain honest about future monetization, and give district and property-type selectors a consistent interaction model.

The work must preserve the existing Rent Check, Explorer, saved-home, lead, experience-report, currency, analytics, and API behavior.

## 2. Reference Direction

The design uses principles rather than copying another site's components:

- Zillow and Redfin: put the rental task before marketing explanation.
- Wise: state the transparency promise directly and make commercial terms visible.
- GOV.UK: remove nonessential material and use predictable, accessible controls.
- Editorial publications: use varied section shapes and link lists instead of turning every item into a card.

Reference URLs:

- https://www.zillow.com/rent/renter-search-center/
- https://www.redfin.com/rentals
- https://wise.com/us/pricing/send-money
- https://www.gov.uk/guidance/government-design-principles

These are visual and content-strategy references only. KoreaHomeGuide keeps its own typography, data terminology, product flow, and visual identity.

## 3. Design Principles

1. **The tool is the product.** Rent Check remains the most prominent home action.
2. **Trust is demonstrated, not repeatedly claimed.** Show the source, method, limitations, and commercial policy once in the right place.
3. **Quiet sections are allowed.** Not every section needs an eyebrow, card grid, paragraph, and button.
4. **One visual family, different interaction models.** Districts are searchable; property types are short native choices.
5. **No invented personality.** Do not add an unverified statistic, stock founder story, fake testimonial, or unsupported claim.
6. **Commercial readiness without commercial pressure.** Future advertising or referrals can be disclosed without adding paid-placement UI now.
7. **English and Chinese are equal products.** The hierarchy, disclosures, and accessible behavior must match across locales.

## 4. Homepage Information Architecture

The homepage becomes five conceptual groups:

1. Hero
2. Rental-stage navigation
3. Rent Check workspace
4. Explorer evidence band
5. Guide index

### 4.1 Hero

Keep the current user question and one supporting sentence. Remove the three-item trust strip as a separate visual component. Replace it with one quiet evidence line that links to About & Methodology.

English intent:

> Is your Seoul rent actually fair?
>
> Check your quote against recent official signed contracts before you commit a large deposit.
>
> Official transaction data, explained for foreign renters. See how KoreaHomeGuide works.

Chinese mirrors the meaning without literal translation stiffness.

The hero may retain one subdued category label, but it must not introduce another card or CTA.

### 4.2 Rental-stage navigation

Preserve the four existing paths and `data-home-stage` hooks, but render them as a compact editorial route rather than four equal cards. Use numbered or directional text links in a single row on desktop and a two-column or vertical list on mobile.

Keep:

- Setting a budget
- Looking at listings
- Got a quote
- Signed the lease

Remove the redundant uppercase eyebrow. The heading may remain human and conversational.

### 4.3 Rent Check workspace

Remove `FREE RENT CHECK`. Keep the current heading, one-line explanation, FX note, form IDs, result structure, experience-report mount, saved-quote mount, lead capture, and all scripts.

The form should read as a working surface, not a floating marketing card:

- no decorative gradient;
- restrained border and shadow;
- strong alignment of inputs;
- the submit button remains the only visually dominant home button;
- result and evidence states retain current semantic colors and data hierarchy.

Delete the complete `How it works` section. Its information is already evident from the form, result, guides, and stage navigation.

### 4.4 Trust note

Place a compact trust note immediately after the Rent Check workspace or inside its lower edge. It is supporting information, not a sixth homepage section.

It links to About & Methodology and states that KoreaHomeGuide:

- uses reported official rental transactions;
- does not show or promote live listings;
- does not accept payment to change Rent Check calculations or evidence order.

Avoid “built by one person in Seoul.” Use “independent project” to preserve privacy.

### 4.5 Explorer evidence band

Keep the darker evidence band because it gives the page one clear visual interruption. Replace the three equal proof cards with:

- `25` — Seoul districts available in Rent Check;
- `15` — districts currently mapped in Explorer;
- one plain source sentence: signed MOLIT rental transactions, not asking prices.

The source sentence is not a third statistic card. Retain one Explorer link.

### 4.6 Guide index

Replace the three guide cards with four editorial rows. Each row contains a short category, title, and one-sentence purpose, but no button-shaped container. Use varied line lengths and clear separators.

Include:

1. How to rent in Korea as a foreigner
2. Wolse vs Jeonse
3. Before you sign
4. Seoul officetel rent

Retain the link to all eight guides.

Delete the final `READY TO COMPARE?` / Chinese equivalent CTA section entirely.

## 5. Visual System

### 5.1 Character

The page should feel editorial, useful, and slightly asymmetric—not luxurious, playful, or corporate-SaaS.

- Keep Geist and the existing Korean/Chinese fallback stack.
- Use warm white and soft neutral section backgrounds, near-black text, and the current blue as the only strong action color.
- Do not add gradients, glassmorphism, stock photography, decorative illustrations, floating blobs, or icon grids.
- Use borders more than shadows. Shadows are reserved for open combobox lists and the active Rent Check result surface.
- Do not wrap every block in a rounded card.
- Use current radius tokens for controls and results; page sections should generally be square or only subtly rounded.

### 5.2 Rhythm

- Hero to stage navigation: tight spacing so they read as one introduction.
- Stage navigation to Rent Check: moderate spacing.
- Rent Check to Explorer: the largest transition.
- Explorer to guides: generous but quieter transition.
- Remove the shared assumption that every section needs the same vertical padding.

### 5.3 Responsive behavior

- Desktop: maximum content width follows the existing site shell; the Rent Check form can use the current multi-column layout.
- Mobile breakpoint: `720px` and below.
- All interactive targets remain at least `44px` high.
- No horizontal scrolling at `320px` CSS viewport width.
- The stage route and guide rows stack without becoming card grids.

## 6. About & Methodology

Create:

- `/about/`
- `/zh/about/`

Both pages receive canonical, reciprocal `hreflang`, `x-default`, metadata, navigation, contact, privacy, terms, and sitemap entries.

### 6.1 Page sections

1. **Why KoreaHomeGuide exists**
   - Korean public rental information is difficult to interpret when the renter does not read Korean.
   - KoreaHomeGuide is an independent project that translates official data into practical checks.

2. **Data and sources**
   - MOLIT reported rental transactions;
   - official brokerage-fee rules and primary government sources;
   - exchange rates are reference conversions and not the legal calculation currency.

3. **How the tools work**
   - Rent Check compares an entered quote with a bounded set of recent comparable contracts;
   - comparison ranges can widen only when evidence is limited;
   - insufficient evidence produces no confident verdict;
   - brokerage calculations follow the published rule branches and do not guess officetel facility eligibility.

4. **What KoreaHomeGuide does not do**
   - no live listings;
   - no brokerage or representation;
   - no appraisal, legal opinion, or guarantee;
   - no payment for a different Rent Check result or evidence order.

5. **Limitations**
   - official transactions do not fully capture condition, view, furnishings, floor, management fees, exact location, or negotiation;
   - missing or thin data is labeled rather than filled with invented precision.

6. **Commercial independence**
   - Current product calculations and evidence order are not paid placements.
   - Future advertising or referral partnerships may be introduced only with clear labels at the point of use.
   - Commercial relationships will not change official transaction data, Rent Check calculations, or evidence ordering.
   - Individual experience reports will not be sold or published as identifiable testimonials.

7. **Corrections and contact**
   - link to `hello@koreahomeguide.com`;
   - invite source, calculation, and translation corrections;
   - link to Privacy and Terms.

### 6.2 Tone

Use direct first-party product language without inventing a team, company scale, credentials, or founder identity. “We” may refer to KoreaHomeGuide as a service, but “independent project” is preferred where ownership context matters.

## 7. Shared Selection UI

### 7.1 District combobox

Use the existing progressive-enhancement model. The native `<select>` remains in HTML and is hidden only after the custom combobox mounts successfully.

Apply it to six surfaces:

- English homepage Rent Check;
- Chinese homepage Rent Check;
- English standalone Rent Check;
- Chinese standalone Rent Check;
- English Explorer;
- Chinese Explorer.

Explorer requirements:

- mount on `#exploreArea` as well as `#rentCheckArea`;
- use the Explorer-supported district catalog;
- preserve `All supported Seoul` / `全首尔支持地区` as an explicit searchable option;
- selecting an option dispatches the existing native `change` event so Explorer history, map clearing, handoff links, and data loading remain unchanged;
- popular-district chips continue to update the native select and the custom input;
- opening the list omits the current selection, while typing can find it again;
- English, Korean, and Chinese search remain available in both locales;
- recent choices remain valid across the full Rent Check catalog but must be filtered to options present in the mounted select.

The combobox API should become selector- and option-aware rather than duplicating a second implementation. It must remain testable without a browser DOM.

### 7.2 Property type

Do not convert property type to a searchable combobox. Keep native selects because each surface has only four or five choices.

Unify visually across the six surfaces:

- same control height, typography, border, radius, focus ring, and dropdown affordance as the closed district combobox;
- bilingual option labels remain visible;
- current option values and API taxonomy remain unchanged;
- mobile uses the platform-native picker.

Budget and currency selects keep their existing behavior but inherit compatible field styling where safe.

## 8. Analytics and Privacy

- Do not add new analytics events solely for the redesign.
- Preserve all existing Rent Check, Explorer, saved-home, lead, experience-report, acquisition, and contextual CTA events.
- Do not send district search text, notes, report identifiers, money values, or exact selection histories through new tracking.
- About links require no click event in this MVP.

## 9. Accessibility

- District combobox retains `role="combobox"`, `aria-expanded`, `aria-controls`, `role="listbox"`, active descendant, keyboard navigation, Escape restore, and native-select fallback.
- Custom controls must have localized accessible names.
- Visible focus applies to links, buttons, fields, guide rows, stage links, and combobox options.
- Reduced-motion behavior remains unchanged.
- Heading order remains logical after section deletion.
- About pages use one `h1` and semantic section headings.

## 10. SEO and Discovery

- Add About pages to `sitemap-static.xml`.
- Add reciprocal `hreflang` and canonical URLs.
- Add About links to English and Chinese homepage footers and relevant shared product footers touched by this work; do not mechanically rewrite every generated market page in this pass.
- Do not claim founder credentials, current partnerships, current paid placements, or a verified outcome rate.
- Do not publish the proposed unverified “25 days” statement.

## 11. Testing and Verification

### 11.1 Test-first contracts

Add failing tests before production edits for:

- homepage section and eyebrow reduction;
- absence of `funnel-how` and `funnel-final-cta`;
- four guide rows and two Explorer metrics;
- preserved Rent Check DOM IDs and script order;
- English and Chinese About pages, metadata, required sections, commercial disclosure, and privacy/terms/contact links;
- sitemap inclusion;
- district combobox mounting on both Rent Check and Explorer selectors;
- Explorer `all` option handling, native change dispatch, external native-select synchronization, and recent-option filtering;
- property selects remaining native and visually aligned;
- keyboard and mobile target contracts.

### 11.2 Automated verification

- focused home/About/combobox tests;
- full `node --test` suite;
- JavaScript syntax checks for changed scripts;
- `git diff --check`;
- no new function-count or deployment-budget regression.

### 11.3 Browser verification

Verify locally and on Production:

- English and Chinese home at desktop and mobile widths;
- no horizontal overflow;
- Rent Check still calculates and renders evidence;
- district search works on all four Rent Check pages;
- Explorer district search works in both locales, including `All supported Seoul`;
- property-type selection and Compare still load the correct area/type;
- stage links, guide links, About links, and language switching work;
- About commercial disclosure is present and readable;
- console has no new errors;
- Vercel deployment matches the GitHub `main` commit.

## 12. Non-goals

- No new monetization integration, ad script, affiliate link, lead buyer, paid report, or checkout.
- No repository visibility or history rewrite.
- No change to legal rate logic, Rent Check comparison logic, API contracts, data providers, or public aggregation thresholds.
- No founder profile, team page, testimonial, generated illustration, or unverified statistic.
- No global redesign of every guide, market, calculator, or dynamic SEO page.

## 13. Success Criteria

The work is successful when:

1. The home has five clear conceptual groups and no repeated How-it-works or final CTA section.
2. Eyebrows are used selectively rather than as the default opening of every section.
3. Rent Check remains the single dominant home action and passes its existing flow tests.
4. About & Methodology clearly explains source, method, limits, commercial independence, and corrections in both languages.
5. District search behaves consistently across Home, standalone Rent Check, and Explorer.
6. Property type remains a fast native choice but visually belongs to the same control family.
7. Automated tests and production browser verification find no regression in existing product flows.
