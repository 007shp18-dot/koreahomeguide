# Explore discovery recovery

Release scope: SignedPrice only. Legacy KoreaHomeGuide is unchanged.

Approved and merged in PR #137, commit `045296291a6d8b194b7ef886ce981f418f9ccd93`.

- Restore the 420px desktop discovery column from the supplied Mockups2 reference.
- Restore the mobile visual order to discovery results followed by the map.
- Increase search/select controls to 44px height and 14px text, and transaction controls to 44px height.
- Preserve market data, map markers, selection handlers and all four view modes.

Validation: 2,030 unit tests, typecheck, build and diff checks passed. Mobile direct visual verification and the full browser suite remain incomplete. Keyboard DOM-order alignment and loading feedback are follow-up work.

Deployment recovery: the initial merge did not produce a Vercel deployment record at verification time. This release-record commit retries the existing Git production deployment path without changing application behavior, credentials, project settings or data.

After deployment, verify the production commit via `/api/status` and measure the Explore discovery width and search-control size. A successful build alone does not complete the remaining Explore roadmap.
