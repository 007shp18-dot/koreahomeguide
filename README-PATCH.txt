KoreaHomeGuide v10.8 Dong SEO patch

Replace/add these repository files preserving paths:
- providers/seoul-config.cjs (replace)
- seo/dong-seo-v10-8.cjs (add)
- api/seo-dong-page.js (replace)
- api/sitemap-market.js (replace)
- tests/v10-8-dong-seo.test.cjs (add)

What changes:
- Dong quality gate aligned at >= 3 contracts for page + sitemap
- Search-first 4 metrics: recent contracts / median monthly rent / median deposit / median size
- Data-driven Market snapshot section
- Same-district curated Nearby neighborhoods internal links
- EN title shifts from Rent Prices to Rent Market; ZH remains localized
- Existing MOLIT/provider calculations and routing are untouched

Verification run in isolated harness:
node --test tests/v10-8-dong-seo.test.cjs
node --check on all changed JS/CJS files

Note: ChatGPT's connected GitHub integration returned HTTP 403 for both Contents and Git object write endpoints, so this patch could not be pushed automatically in this session.
