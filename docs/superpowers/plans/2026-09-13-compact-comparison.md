# Compact Dubai comparison

The user finds the Dubai comparison and rectangular controls oversized. Live
inspection shows a two-area dialog at 1060 × 842px and table rows at 63–75px.
Keep the existing information and functions, but make the supporting UI quieter.

## Scope

- Size the comparison dialog for two or three areas; reduce header and table padding.
- Replace the boxed comparison tray with a compact strip and text removal actions.
- Reduce saved comparison and note chrome; keep notes collapsed and explicitly saved.
- Preserve all sale/rent, period, source, missing-data and browser-storage context.
- Keep 44px interactive targets, 14px controls, 16px text inputs and visible focus.
- No homepage, data, map, network, dependency or storage changes.

## Execution and verification

1. Implement inline in the existing checkout using scoped CSS and existing components.
2. Run focused comparison/journal tests, lint and type checks.
3. Inspect hosted desktop and mobile comparison, saved and note screens; run the
   existing comparison/saved browser flows in CI. Review the completed diff.
4. Merge only after required checks pass, then verify the existing production site.
