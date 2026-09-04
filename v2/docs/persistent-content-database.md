# Persistent content database

SignedPrice keeps public transaction artifacts in the existing checked-in data pipeline. PostgreSQL stores the data that must accumulate or be editorially approved: Naver news, exact building-photo approvals, official building facts, content articles, and ingestion history.

## Connect the database

1. Create a managed PostgreSQL database in the Vercel Marketplace (Neon is supported by the installed serverless driver).
2. Add `DATABASE_URL` to Production, Preview, and Development. Keep it server-only.
3. Add independent random values for `CRON_SECRET` and `CONTENT_ADMIN_SECRET`.
4. Redeploy. The build applies unapplied versioned migrations automatically when `DATABASE_URL` exists. `pnpm db:migrate` remains available for an explicit manual run.
5. The daily Vercel cron calls `/api/internal/news-ingest`; normal News requests also merge the latest cached Naver response with stored history.

If the database is absent or temporarily unavailable, the public pages keep using the existing live/fallback sources. Database errors are logged server-side and secrets are never returned.

## Building photos

Only an exact, reviewed building identity can become `approved`. Provider search results stay outside the registry until reviewed. The public `/api/building-photo` route returns approved metadata only.

Submit an approval to `POST /api/internal/building-photo-approval` with `Authorization: Bearer <CONTENT_ADMIN_SECRET>`:

```json
{
  "registryKey": "kr-seoul:gangnam-gu-example",
  "marketKey": "seoul",
  "buildingKey": "seoul:gangnam-gu-example",
  "externalId": "gangnam-gu-example",
  "buildingName": "Example Apartments",
  "address": "Exact verified address",
  "provider": "google-place",
  "placeId": "verified Google Place ID",
  "assetUrl": null,
  "attributionName": null,
  "attributionUrl": null
}
```

For an owned or separately licensed image, use `owned-object` or `licensed-url`, set an HTTPS `assetUrl`, and include attribution when the license requires it. Image bytes belong in object storage; the database stores identity, approval, attribution, and health state.

## Data ownership

- `buildings` is the canonical identity table.
- `building_photos` stores review status and provider/object references.
- `building_facts` caches exact K-apt and Building Register matches for 30 days.
- `news_articles` deduplicates by canonical URL and keeps first/last seen timestamps.
- `ingestion_runs` records scheduled news outcomes.
- `content_articles` is the publication layer for future SignedPrice guides.
