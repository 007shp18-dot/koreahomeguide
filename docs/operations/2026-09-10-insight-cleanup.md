# Insight article cleanup — 10 September 2026

Scope: the checked-in English editorial inventory and its Korean counterparts. This is not a count of additional articles stored only in the production content database, and it does not certify every underlying market or policy claim again.

## Inventory and decisions

| Collection | English records | Decision |
| --- | ---: | --- |
| City buying stages | 24 | Retain as step-by-step guides; already excluded from the Insight feed. Move six-stage navigation below the article into a disclosure. |
| Seoul neighbourhood articles | 3 | Retain Seongsu, Wangsimni and Mangwon. Standardize the article frame; revise Seongsu's English copy to connect local life with housing type, access and budget. |
| City issue analyses | 3 | Retain the Seoul buy/jeonse/rent, Singapore new-launch and Tokyo ownership-cost analyses with their source links and explicit hypothetical tables. |
| City overview stories | 4 | Retain as navigation/overview pages, outside the Insight feed. Use the same reading width and article header as their detailed articles. |
| Daily neighbourhood notebook | 4 | Retain Yeonhui-dong, Joo Chiat/Katong, Al Quoz and Kichijoji; align the header, contents, body width, local-life section and source footer. |
| Editorial portfolio | 36 | Six policies, eleven market briefs, three news briefs, seven data stories and nine guides. Preserve their public URLs. Three news briefs remain in News; six procedural guides remain outside Insights. |

The static Insight feed had **37** items: four notebooks, three neighbourhoods, three issue analyses and 27 portfolio entries. It now has **33**. Four coverage/methodology explainers are removed from Latest stories and retained as references linked from the relevant monthly reports:

- `/news/seoul-sale-market-monthly-brief/`
- `/news/seoul-jeonse-market-monthly-brief/`
- `/news/seoul-monthly-rent-market-brief/`
- `/news/singapore-private-market-quarterly-brief/`

There is **one** standalone Seongsu article. The Seoul overview, discovery stage and Seongsu/Wangsimni/Mangwon comparison address different reader questions; they are not duplicate standalone Seongsu publications. None was deleted or redirected. No database rows, publication dates or evidence statuses were changed.

## Layout causes and fixes

Previously, whether an article had a `PHOTO_ESSAYS` mapping determined whether the six-stage navigation and contents were visible. Seongsu had a mapping; Wangsimni and Mangwon did not. The latter also received a generic Seoul skyline despite being neighbourhood-specific articles.

All five public article renderers (journey, notebook, general analysis, policy record and city overview) now share an article header and a 700px reading column inside the same page frame. Policy timelines and analytical tables retain their distinct content structure. All neighbourhood articles use the same contents/body/related/source pattern. Photo credits remain available in compact disclosures.

## Photo correction and limitations

- Insight cards did not pass a journey article's actual photograph, so the Seongsu card fell back to a generic Seoul photograph. A shared content-level photo resolver now supplies the same image to the card and article.
- Seongsu now opens with the existing `seongsu-evening-street.jpg`, visually inspected and checked against [the Commons source](https://commons.wikimedia.org/wiki/File:Evening_street_in_Seongsu-dong.jpg). The source identifies Seongsu-dong, camera coordinates 37.547883, 127.040450, capture date 22 April 2021, author CartoonChess, CC BY-SA 4.0. This is an archival image, not a claim of a 2026 shoot.
- The existing Seoul Forest boardwalk remains a supporting image; the dated 2009 lake photograph is removed from this story's selection.
- Wangsimni and Mangwon have no verified local photograph in the checked-in assets. Their generic Seoul fallback is removed instead of implying a different location. They remain readable articles with the same layout and working next steps. New imagery still needs a verifiable local asset; a Commons download attempt was blocked by a 403 response.

## Verification targets

- `/news/?market=seoul` — Seongsu card uses the local street photograph; Wangsimni/Mangwon do not use the city skyline.
- `/news/city-stories/seoul/seongsu/`
- `/news/city-stories/seoul/wangsimni/`
- `/news/city-stories/seoul/mangwon/`
- `/news/neighbourhoods/yeonhui-dong/`
- `/news/neighbourhoods/joo-chiat-katong/`
- `/news/dubai-rental-yield-after-costs/`
- `/news/policy/korea-foreign-property-reporting-status/`
- `/news/seoul-monthly-2026-09/` and `/news/singapore-monthly-2026-09/` — coverage reference links remain accessible.

Focused tests cover card/article image identity, local-photo fallback removal, shared neighbourhood structure, retained public reference URLs and report links, and existing newsroom/monthly/publication route contracts. Production browser verification is performed by the integrating agent.
