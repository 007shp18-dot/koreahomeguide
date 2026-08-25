KoreaHomeGuide — Rent Check coverage/navigation fix

Replace:
- tools/seoul-rent-check/index.html
- zh/tools/seoul-rent-check/index.html

Add:
- tests/rent-check-coverage.test.cjs

Changes:
- Rent Check Area selector expands from 5 to all 10 supported Seoul districts:
  Gangnam, Seongdong, Mapo, Yongsan, Yeongdeungpo,
  Gwanak, Dongdaemun, Seodaemun, Seongbuk, Gwangjin.
- Simplified Chinese labels are added for the same five new districts.
- EN header Guides link now points to /guides/
- ZH header Guides link now points to /zh/guides/

Unchanged:
- Rent Check API/app logic
- v11 Fair Rent Intelligence
- canonical/hreflang
- currency selection
- property types
- layout/CSS
- referral/advertising logic

Verification before packaging:
- TDD RED confirmed on current 5-district/direct-guide state.
- 4/4 focused tests passed after change.
- Source invariants passed.

GitHub connector write access still returns HTTP 403, so upload this patch manually to main.
