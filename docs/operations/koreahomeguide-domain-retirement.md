# KoreaHomeGuide domain retirement

## Current state

- Keep `koreahomeguide.com` connected to Vercel, with working DNS and TLS. The old application may become a redirect-only service, but the domain must not be disconnected.
- The migration manifest currently installs 67 permanent redirects: 27 exact URL redirects and 40 legacy neighbourhood/building-family redirects.
- Migrated URLs are removed from the legacy static sitemap. Migrated district/property-type child sitemaps are removed from the legacy sitemap index.
- Every URL still present in `sitemap-static.xml` is explicitly classified in `data/seo/signedprice-migration-manifest.json` as retained.

## Retirement blockers

The remaining retained static assets must stay live until a verified SignedPrice equivalent exists or an explicit removal decision is made:

- 31 Chinese-language URLs without a SignedPrice Chinese equivalent.
- 8 English guide articles whose content has not yet been republished on SignedPrice.
- 10 English district/property-type pages below the SignedPrice publication floor.
- 2 calculators without a replacement.
- 4 intent pages without a sufficiently equivalent destination.

The legacy dynamic sitemap families that are not removed from `sitemap.xml` are also retained. This includes opportunity pages and district/property-type families whose SignedPrice targets are not yet publishable.

## Cutover order

1. Deploy and verify every redirect returns one HTTP `301` hop to a `200`, indexable SignedPrice canonical URL.
2. Verify `koreahomeguide.com`, `www.koreahomeguide.com`, and any other indexed variants in Google Search Console.
3. Submit a Change of Address from each verified old-domain variant to `signedprice.com`.
4. Submit `https://www.signedprice.com/sitemap.xml` in the SignedPrice Search Console property.
5. Update owned links, profiles, ads, and the most valuable external backlinks to their final SignedPrice URLs.
6. Monitor old-domain coverage, redirect errors, new-domain indexing, and search traffic during the move.
7. Keep the redirect service for at least one year; keeping it indefinitely is safer for users and old backlinks.
8. Do not add `noindex`, block crawling in `robots.txt`, remove DNS, or let TLS expire while redirects are transferring signals.

## Verification

Run:

```sh
node scripts/seo/build-signedprice-migration.cjs
node scripts/seo/render-signedprice-migration.cjs
node scripts/seo/validate-signedprice-migration.cjs
node --test tests/signedprice-migration.test.cjs
```

The validator fails if a redirect differs from the manifest, a migrated static URL remains in the old sitemap, a migrated dynamic sitemap family remains published, or a remaining static sitemap URL is not classified.

## References

- [Google Search Central: Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Google Search Console: Change of Address tool](https://support.google.com/webmasters/answer/9370220?hl=en)
- [Google Search Central: Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects)
