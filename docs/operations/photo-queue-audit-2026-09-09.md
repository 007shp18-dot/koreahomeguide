# Whole photo queue triage

Snapshot: 2026-09-09 05:34:22 UTC, Neon production branch `br-super-butterfly-b31hhh93`.

This is a classification of every pending row. It is not an approval recommendation. An asset host can make source reconstruction easier, but it does not prove that a photo is reusable.

## Queue result

| Mutually exclusive cohort | Pending rows | Distinct asset URLs | NAVER title-match rows | NAVER title-match distinct URLs | Distinct source or license evidence |
|---|---:|---:|---:|---:|---|
| Licensed non-NAVER | 21 | 21 | 0 | 0 | Present; visual and exact-subject review remains |
| Google provider-display | 1 | 0 | 0 | 0 | Google place/source present; visual and identity review remains |
| NAVER result on Wikimedia Commons asset host | 156 | 96 | 8 | 8 | Missing from the row; host is only a reconstruction lead |
| NAVER result on government/institution host | 19 | 18 | 11 | 11 | Missing from the row; public host does not grant reuse rights |
| NAVER result on a license-capable platform | 44 | 42 | 24 | 24 | Missing; Flickr, Geograph and iNaturalist licenses are asset-specific |
| Other NAVER result with unknown rights | 40,461 | 13,753 | 5,916 | 5,191 | Missing |
| **Total** | **40,702** | — | **5,959** | — | — |

The 21 licensed rows comprise 16 at confidence 0.60 and five at 0.75. The NAVER population comprises 34,721 rows at 0.35 and 5,959 at 0.65.

## Provenance and duplication

- Every one of the 40,680 NAVER rows stores the raw asset URL as both `source_page_url` and `attribution_url`. None has a distinct source page or license record.
- NAVER has 13,909 distinct URLs. There are 3,858 duplicated URL groups and 26,771 rows beyond the first use of a URL. One URL is attached to 415 candidate rows.
- The 5,959 high-confidence NAVER rows reduce to 5,234 URLs. Of those, 4,525 occur once and 709 are shared. There are 725 extra high-confidence rows attached to an already-used high-confidence URL. Another 281 URLs occur in both confidence bands.
- Confidence 0.65 means only that the normalized building name appeared in the NAVER result title. The title itself and image dimensions were not persisted, so this is not exact-building or rights verification.

## Largest domains among confidence-0.65 NAVER rows

| Asset host | Rows | Distinct URLs | Source assessment |
|---|---:|---:|---|
| `landthumb-phinf.pstatic.net` | 2,172 | 1,990 | NAVER real-estate thumbnail CDN; rights unknown |
| `image.hogangnono.com` | 1,157 | 1,034 | Commercial real-estate platform; rights unknown |
| `file.kbland.kr` | 528 | 468 | Commercial real-estate platform; rights unknown |
| `ldb-phinf.pstatic.net` | 371 | 293 | NAVER place/image CDN; rights unknown |
| `www.neonet.co.kr` | 305 | 272 | Commercial real-estate platform; rights unknown |
| `i.pinimg.com` | 150 | 67 | Social image CDN; unsuitable without original source |
| `img.peterpanz.com` | 83 | 68 | Commercial property platform; rights unknown |
| `dynamic-media-cdn.tripadvisor.com` | 75 | 74 | Travel CDN; rights unknown |
| `pup-post-phinf.pstatic.net` | 63 | 58 | NAVER post CDN; rights unknown |
| `cdn-auction.disco.re` | 56 | 39 | Commercial property/auction CDN; rights unknown |
| `file1.bobaedream.co.kr` | 50 | 48 | Community platform; rights unknown |
| `t1.daumcdn.net` | 44 | 36 | Generic portal CDN; rights unknown |
| `d2u3dcdbebyaiu.cloudfront.net` | 41 | 36 | Generic CDN; origin and rights unknown |
| `static.cdn.soomgo.com` | 35 | 35 | Commercial service CDN; rights unknown |
| `scs-phinf.pstatic.net` | 34 | 28 | NAVER CDN; rights unknown |

## Next review cohort

The private review worklist contains 41 candidates selected from the whole queue:

1. 21 licensed Commons rows with complete source/license fields. Review the actual pixels and exact subject. The intended building must be clearly identifiable at the displayed size. Adjacent buildings are allowed. Interior/facility photos need accurate separate gallery roles.
2. One Google place candidate. Review the live provider image and place identity.
3. Eight confidence-0.65 NAVER rows on `upload.wikimedia.org`. Seven have obvious subject/location conflicts from their filenames and can be rejected. Only Beauty World Plaza merits Commons-page reconstruction before visual review.
4. Eleven confidence-0.65 NAVER rows on government/institution hosts. All have unique URLs, but all still lack a distinct source page and reuse policy. Prioritize the two specific apartment names; quarantine generic names until a source page and exact subject are established.

No candidate in this report should be automatically approved. The review outcome should be recorded per candidate ID, with rejection retained as evidence rather than deleting the discovery row.

## Pause verification

NAVER provider health was set to paused at 2026-09-09 04:35:37.719 UTC. The latest NAVER candidate was created, updated and checked at 04:31:51.191 UTC. Zero NAVER candidates were written after the pause timestamp. The final 250-row increase completed before the pause and does not show that the pause was bypassed.

## Review follow-up

The 21 licensed candidates were inspected: 10 usable exteriors or correctly labeled parent-estate photos, nine unsuitable exterior subjects, and two unresolved subjects. Independent source reconstruction and direct pixel review recovered a usable Beauty World Plaza exterior from one NAVER lead; it is recorded as a separate Commons candidate with its own source/license evidence. The raw NAVER row is not relabeled as licensed. This yields 11 new approval decisions, not a claim that the remaining queue is unusable. Existing automatic approvals are audited separately. See [candidate decisions](./photo-review-2026-09-09.json); production execution is tracked separately from this queue snapshot.
