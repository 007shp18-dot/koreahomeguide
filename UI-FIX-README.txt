KoreaHomeGuide calculator readability + contact patch
Date: 2026-08-25

Apply
1. Extract this ZIP over the repository root, preserving paths.
2. Commit and deploy through the existing workflow.

Changes
- Brokerage calculator result amounts now retain their intended large typography.
- Calculator labels and supporting converted values use a more readable size and contrast.
- Standalone Rent Check uses a three-column layout inside the product content area.
- Rent Check amount/size inputs can shrink without clipping the value or unit.
- Homepage primary Rent Check CTA sits 6px closer to the hero copy.
- Every public "Email us" mailto link now points to hello@koreahomeguide.com.

Verification
- Focused regression suite: 17 passed, 0 failed.
- No public HTML file contains 007shp18@gmail.com.

Note
The reconstructed source bundle has four pre-existing full-suite failures unrelated to
this patch (legacy navigation/sitemap expectations and a missing lib/api-guard.cjs).
