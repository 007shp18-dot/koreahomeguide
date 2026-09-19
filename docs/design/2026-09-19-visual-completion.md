# SignedPrice visual completion — 19 September 2026

The user requested a direct comparison with the original generated mockups, correction of awkward photography, completion of unfinished pages, clearer chart intent, and useful UI/UX and 3D touches.

## Applied design

- Home: photographic Seoul hero, real featured article, compact four-city navigation, asymmetric chart/story/planning panels, and three current editorial cards.
- Planning: a decorative cobalt miniature house with restrained CSS depth and hover transitions. Reduced-motion preferences disable transforms and transitions. No animation library or WebGL runtime was added.
- Explore/detail: visible evidence hierarchy, compact contextual media, and mobile List/Map controls that retain the mounted map and search state. Tokyo retains its existing accessible results sheet.
- Editorial/guides/tools: readable title hierarchy, selected article photographs, portrait containment, a desktop contents rail, source summary, and localized onward actions.
- Charts: question-led titles; visible periods, units, latest/previous values and change; exact tables and sample sizes; gaps, suppressed values and incomplete months remain explicit.

The reference home chart is an illustrative price index. The implemented chart instead uses the actual published report's transaction counts, with its period and selected cohort stated. Contextual photographs are never presented as photographs of individual transactions or current listings.

## New photography

All source images are locally served through Next Image. City thumbnails use intentional focal positions; article cards prefer their own uploaded or curated photograph.

| Asset | Photographer / source | License |
| --- | --- | --- |
| `seoul-ethan-brooke.jpg` | [Ethan Brooke — Seoul at night](https://unsplash.com/photos/a-view-of-a-city-at-night-from-a-bridge-E0awymZfM1k) | [Unsplash](https://unsplash.com/license) |
| `singapore-kevin-wang.jpg` | [Kevin Wang — Marina Bay](https://unsplash.com/photos/an-aerial-view-of-a-city-at-night-A1fSrS-mIs4) | [Unsplash](https://unsplash.com/license) |
| `tokyo-christian-macmillan.jpg` | [Christian MacMillan — Tokyo Tower](https://unsplash.com/photos/aerial-view-of-city-buildings-during-daytime-cMTWrbqcESs) | [Unsplash](https://unsplash.com/license) |
| `budget-house-3d.png` | Generated decorative illustration for this interface | Not a property photograph |

Original mockups were recovered from the user's files and reviewed directly. Existing approved component references informed the card grouping, typography, shared controls, responsive panels and reduced-motion behavior.
