# SignedPrice journey cleanup — 7 September 2026

Base: `8a39f48` (main). Production was audited through the public UI before editing.

## Changes

- Singapore private-sale Check: the repository expected a separate Check artifact, but the checked-in activation registry contained only Explore data. Rebuilt the Check artifact from the digest-verified URA source: 133,942 records, August 2021–August 2026. Evaluation retains its existing completed-month window and five-comparable publication gate. Added the compressed source to server output tracing. The installed-data test now checks PARKTOWN RESIDENCE successfully.
- HDB Check: the current HDB release contains summaries, not the individual records required by Check. Unavailable sectors now show an explanation and Explore link instead of empty select boxes and an enabled submit button. No synthetic transactions or reconstructed distributions were created.
- Article figures: the Seoul and Singapore affordable-home figures now lead to their city's Explore view. Related article links are labelled as reading, rather than transaction records. Existing companion articles and numerical evidence are preserved.
- Dubai scenario: the entered annual rent travels with price and area into the ownership calculator, where it is divided by 12 and identified as the user's editable assumption. Switching markets clears that assumption along with property context.
- Seoul Check: replace the editable internal building ID with a named selection. The selected building can be cleared in favour of district evidence; changing district or property type removes an incompatible building selection. Explore remains the route for choosing another building.
- English names: add bounded display aliases for 24 neighbourhoods and seven featured estate names, retaining Korean source identities. Use those labels in Explore, Passport, building headings and the Check building selection. Unmapped names remain in Korean rather than receiving invented brands.
- Passport: show periods beside the area estimates and explain different city aggregation bases. Add name/area search inside the budget-qualified candidates so readers do not have to traverse hundreds of pages. Existing budgets, sample counts, evidence links and costs links remain intact.
- Transaction rows: use filed-price labels rather than calling each individual transaction a median.

## Verification

- 63 tests passed across 13 relevant files, including installed Singapore evidence, route models, entity navigation, article rendering, Passport and scenario context.
- ESLint passed for the 15 changed product modules checked.
- Production build passed (2,761 static pages generated). The Singapore Check server trace includes its compressed evidence artifact.
- A supervised visual preview could not start: the preview sandbox cannot resolve the existing monorepo's Next dependency and forwards Vite-specific arguments. The application was not reconfigured to work around that infrastructure mismatch. New mobile visual checks and interactive browser checks of this branch remain outstanding.

## Remaining scope and roadmap

1. Verify the deployed/preview branch visually and exercise candidate filtering, selection reset, Singapore Check and transferred rental assumptions.
2. Resolve the Dubai navigation registry discrepancy. A public area-level Check exists, but the capability registry still marks Check `rights_blocked`. This patch does not bypass that gate or change source permissions. Confirm the approved scope and reconcile the registry separately.
3. Extend English aliases using verified building/address identities; this patch is not a complete translation of Seoul's inventory.
4. Keep the existing school/station typography fix from PR #187. Verify representative populated profiles on mobile; missing coordinates or an unmatched K-apt record cannot be repaired with CSS.
5. Verify existing save functionality end to end before calling it a released retention feature. Community remains read-only. Do not add posting or authentication as part of this cleanup.
6. Verify actual analytics event delivery and referral-to-tool conversion before prioritising more promotion channels, subscriptions, apps or new cities.
7. Reconcile historical collection checkpoints and cancellations before claiming 2020–2025 completeness. Today's Check repair does not complete that collection.

No production database writes, source-permission changes, community posts or deployment promotion are included in this patch.
