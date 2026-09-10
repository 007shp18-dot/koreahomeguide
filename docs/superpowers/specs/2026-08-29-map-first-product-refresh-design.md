# KoreaHomeGuide map-first product refresh design

## Outcome

KoreaHomeGuide becomes a compact, data-first rental decision product. The home page answers one question, Rent Check promotes its verdict and evidence, Explorer becomes a large live map with a comparable building list, and a selected building opens a three-part decision window. English and Simplified Chinese keep the same hierarchy and the same KRW-first financial meaning.

## Design decisions

### One visual system

- Preserve the existing Geist, slate, white and blue token system.
- Use rules and whitespace for hierarchy; avoid nested rounded cards.
- Keep long prose at 60–62ch and CJK prose near 44ch.
- Keep the desktop English hero on one line when the viewport can support it; do not import the mockup's 15ch heading cap.
- Use one blue emphasis per block. Red is reserved for an above-market warning and green for confidence or completion.

### Home and Rent Check

- Treat the headline and quote form as one hero task with a compact transition rather than two independent sections.
- Align the six quote controls without letting Size presets increase the control row height.
- Keep KRW as the primary figure in both languages. Converted currency remains a clearly approximate reference.
- Hide idle status copy, but expose loading, error and completion states to assistive technology.
- Promote the Rent Check difference and annualised impact over the two input figures.
- Keep the privacy-safe result share URL. A downloadable image may show the verdict and evidence band, but never the user's exact deposit or monthly quote.

### Map-first Explorer

- Desktop uses a 64/36 map-to-list split below a compact filter bar. The map remains sticky and occupies most of the viewport.
- Mobile uses a viewport-height map and a bottom sheet for summary, list and selected-building actions.
- All-Seoul and district results first show neighborhood markers. Selecting a neighborhood reveals building markers and the building list.
- Panning or zooming filters already located markers immediately. If the visible range cannot be satisfied from the currently loaded result set, a visible `Search this area` action appears. This prevents hidden network churn and makes the result boundary explicit.
- Geocoded building locations are cached in the browser. Cached buildings may appear immediately; new geocoding stays bounded to protect map quotas.
- The list defaults to strongest evidence. Users can sort by deposit-adjusted price per square metre or recency.
- Map pins and rows use the same value definition.

### Comparable price per square metre

- Raw monthly rent per square metre is not comparable when deposits differ.
- Normalize each transaction to an effective monthly cost: `monthlyRentWon + depositWon * 0.05 / 12`.
- Divide the normalized monthly cost by floor area and expose it as `adjustedPerSqmWon`.
- Compute medians only from valid rows and keep the existing three-contract evidence threshold.
- Label the value `Deposit-adjusted ₩/㎡` in English and `押金校正 ₩/㎡` in Chinese, with a short explanation.

### Building decision window

- Panel 1: address, building profile, Street View and the building's typical signed terms.
- Panel 2: deposit-adjusted price per square metre against the dong and district, with numeric pairs and evidence counts.
- Panel 3: recent contracts, each with its own adjusted price per square metre.
- NAVER Street View stays explicitly labelled as a nearby street view, not a listing photo.
- Tabs are mobile navigation only. Desktop shows all three panels simultaneously.
- Community-only fields are shown only after the publication threshold is met; no empty or fabricated values.

### Supporting surfaces

- Guide pages get a narrow readable measure, one table-of-contents box, accessible tables and a closing Rent Check action.
- A static compare tool uses the existing Explorer API and shows two districts with a deposit-adjusted comparison.
- An embeddable district snapshot uses the existing Explorer API and includes a crawlable credit link.
- Sponsored placements are dormant until real approved partners exist. CSS and rendering guards allow only one post-result slot and reject broker/listing categories.

### Community activation gate

Contribution and Q&A need durable server storage, contributor identity, abuse limits and moderation. The UI, schemas, validators and publication rules can ship behind a disabled feature flag. Public writes and reads must remain off until an approved durable store and operator moderation destination are configured. The site must never pretend a submission was saved when it was not.

## Accessibility and responsive behavior

- Every interactive building row is keyboard-operable and ignores clicks that originate in a nested link.
- Touch targets are at least 44px.
- Map, list and bottom sheet have explicit labels and status regions.
- Focus returns to the building row after the decision window closes.
- Reduced-motion users get no modal or sheet transition.
- At 860px the decision window becomes tabbed; at 760px the Explorer becomes map plus bottom sheet; at 620px quote metrics and tables become stacked labelled rows.

## Verification

- Unit tests cover normalized per-square-metre calculations, medians, invalid areas and the evidence threshold.
- Source/DOM tests cover the map-first shell, search-this-area state, keyboard rows, mobile sheet, safe sponsor guard and disabled community gate.
- Existing full suite remains green.
- Local browser verification covers English and Chinese home, Rent Check, Explorer, building window, NAVER Street View, compare and embed.
- Production verification confirms the GitHub tree, Vercel READY state, live API responses, browser flows and runtime error clusters.
