# NAVER nearby street view setup

KoreaHomeGuide keeps Google Maps as the Explorer base map and loads NAVER Panorama only after a user selects a verified building marker. The UI labels the result as nearby street view, not a building or listing photo.

## Application setup

1. Create a Maps application in NAVER Cloud Platform.
2. Enable Web Dynamic Map and its `panorama` submodule.
3. Register the main web service URL: `https://koreahomeguide.com`.
   - Do not add a path, port, or separate `www` entry. NAVER's current application guide asks for the main domain only and says to exclude `www`.
   - Add a stable preview or local origin only while testing and remove it afterward.
4. Add the public key ID to Vercel Production and Preview as `NAVER_MAPS_NCP_KEY_ID`.
5. Redeploy after changing the environment variable.

The key ID is used in the browser and is therefore public by design. Restrict it by the registered web service URLs and enable only the required Maps product.

## Safety behavior

- The NAVER SDK loads only after a building marker click.
- NAVER may find the nearest panorama within 300 metres. KoreaHomeGuide reads the returned capture coordinate and displays it only when it is within 50 metres of the verified building coordinate.
- A missing key, failed SDK request, failed panorama request, or capture beyond 50 metres does not affect the base map or transaction data.
- Panorama IDs are not stored.
- When available, the capture date is displayed.

## Production verification

Verify both `/explore/` and `/zh/explore/` on desktop and mobile:

1. Select a district and housing type.
2. Open a neighborhood and then a building marker.
3. Confirm the nearby street-view heading is localized.
4. Confirm a nearby panorama displays and remains interactive.
5. Confirm a building without a nearby panorama shows the localized unavailable state rather than an unrelated image.
6. Confirm neighborhood markers never request or display panorama content.

Reference: [NAVER Maps JavaScript Panorama](https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Panorama.html)
