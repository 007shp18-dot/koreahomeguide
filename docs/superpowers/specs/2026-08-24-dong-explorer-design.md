# KoreaHomeGuide v9.4 Dong Explorer Design

## Goal
Extend Rent Explorer from district-level building discovery to District → Dong → Building navigation while preserving the simple UI and current MOLIT on-demand data model.

## Scope
- Keep Seoul-only public UI for this version.
- Add dong-level summaries and filtering for English and Simplified Chinese Explorer.
- Strengthen building identity from building name only to district + dong + building name.
- Preserve existing district summary metrics, building detail, currency conversion, date localization, and Rent Check prefill.
- Do not add a database, map-first UI, reviews, listings, user accounts, or indexable dong/building SEO pages yet.

## User flow
Seoul → district → property type → neighborhood (dong) → buildings → building detail → Rent Check.

The district-level Explorer remains usable without selecting a dong. Dong cards provide an additional drill-down instead of adding complex filters.

## Data model
City → District → Dong → Building → Transactions.

Each normalized transaction preserves `dong`. Dong identifiers are normalized Korean legal-dong names. Building keys include normalized dong + normalized building name so identical building names in different dongs do not collide.

## APIs
- `/api/explore-area`: district summary + dong summaries + district-wide buildings.
- `/api/explore-dong`: selected dong summary + buildings within that dong.
- `/api/explore-building`: accepts district/type/buildingKey and resolves the dong-qualified key.

## UI
English and Chinese `/explore/` pages gain a compact Neighborhoods section. Selecting a dong updates summary + buildings and keeps current district/property type/currency. A “All neighborhoods” control returns to district view.

Building detail metadata includes the dong when available. EN/ZH switches retain district/type/dong/building parameters.

## Chinese labels
Chinese pages display a curated translation for common starter dongs when available and always preserve the Korean name in parentheses, e.g. `延南洞 (연남동)`. Unknown dong names fall back to Korean text rather than invented translations.

## SEO
No new indexable dong/building pages in v9.4. `/explore/` remains the indexable discovery page; query-based detail states stay non-indexed where already configured.

## Packaging
The production tree currently exceeds GitHub web upload’s 100-file-per-upload limit. Deliver:
1. the complete v9.4 ZIP;
2. upload batch ZIPs, each containing a subset of the production tree at the correct relative paths and fewer than 100 files, so the user can extract each batch locally and upload its contents to repo root sequentially.
Tests/docs are excluded from upload batches to reduce production upload count where safe; the complete archive retains them.
