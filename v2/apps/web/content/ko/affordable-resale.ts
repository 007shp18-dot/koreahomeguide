import type { EditorialPortfolioRecord } from '../portfolio-types';

export const KOREAN_AFFORDABLE_RESALE_STORIES: readonly EditorialPortfolioRecord[] = [
  {
    "id": "ko:seoul-84sqm-under-one-billion-2026",
    "slug": "seoul-84sqm-under-one-billion-2026",
    "locale": "ko",
    "marketId": "kr-seoul",
    "type": "data-story",
    "title": "최근 서울 전용 84㎡ 아파트가 10억원 이하에 거래된 곳은?",
    "deck": "2026년 7~8월 반복 거래와 8월 거래 최소 1건이 확인된 아파트 그룹 23개. 날짜와 표본 수를 갖춘 최근 가격으로 주택 검색을 시작합니다.",
    "readerQuestion": "2026년 7~8월 서울에서 전용 84㎡가 10억원 이하에 반복 거래된 아파트는 어디인가요?",
    "bodyMarkdown": "## 6개월 전 가격보다 최근 실거래부터 확인하기\n\n예산이 10억원이라면, 최근 전용 84㎡ 주택이 실제로 그 예산 안에서 거래된 곳이 어디인지가 핵심입니다. 2026년 7~8월 자료에서 적격 거래가 5건 이상이고, 중앙값이 10억원 이하이며, 10억원 이하 거래가 3건 이상이고, 8월 거래가 최소 1건 확인되는 서울 아파트 식별자 23개를 찾았습니다.\n\n이들 그룹의 적격 거래는 총 168건이며, 그중 164건이 10억원 이하입니다. 현재 매물을 확인하기 위한 출발점입니다. 실제 매물 재고나 매도 가능 여부를 확인하지 않았으므로, 오늘 이 가격에 주택을 살 수 있다는 의미는 아닙니다.\n\n## 검색을 시작할 세 가지 가격대\n\n5억~6억 5,000만원대에서는 방학동 우성아파트2(자료상 건축연도 1993년), 도봉동 한신(1995년) 등 오래된 단지에서 적격 거래가 반복됐습니다. 7~8월 중앙값은 각각 5억 4,350만원과 6억 4,750만원이었고, 거래는 6건과 16건이었습니다.\n\n7억 5,000만~8억 5,000만원대에서는 관악산휴먼시아2단지(2008년)가 7건, 중앙값 7억 5,700만원을 기록했습니다. 에스케이북한산시티(2004년)는 12건, 중앙값 8억 4,650만원이었습니다.\n\n10억원 상한에 가까운 백련산힐스테이트1차(2011년)는 5건, 중앙값 9억 4,000만원이었습니다. 남서울힐스테이트(2014년)는 6건, 중앙값 9억 8,250만원이었습니다. 상한에 가까울수록 계약금액에 포함되지 않은 세금과 기타 매수 비용을 감당할 여유가 줄어듭니다.\n\n예시 단지들은 위치, 연식, 개별 주택 특성이 다릅니다. 예산에 맞는 검색의 출발점이며, 어느 주택의 가치가 더 높은지를 매긴 순위가 아닙니다.\n\n## 예산 7억원과 10억원의 검색 결과는 어떻게 다를까?\n\n| 단지 중앙값 구간 | 적격 그룹 수 | 해당 그룹 거래 수 |\n|---|---:|---:|\n| 7억원 이하 | 8 | 71 |\n| 7억원 초과~8억 5,000만원 이하 | 5 | 41 |\n| 8억 5,000만원 초과~10억원 이하 | 10 | 56 |\n\n위 구간은 이 기사의 후보 그룹 23개를 중복 없이 나눈 것입니다. 각 그룹은 중앙값이 속하는 구간에 배정되며, 개별 거래가격은 그 구간을 벗어날 수 있습니다. 이 수치는 매도 중인 주택 수나 예산별 서울 전체 단지 수를 뜻하지 않습니다.\n\n가장 낮은 가격대에서는 유난히 싼 거래 한 건 대신 살펴볼 그룹 8개가 제시됩니다. 예산을 8억 5,000만원까지 올리면 이 표본에서 5개가 추가됩니다. 마지막 구간은 10개를 더하지만, 예산이 크다는 사실만으로 상태가 더 좋거나 통근 시간이 짧거나 투자성이 높다고 할 수는 없습니다.\n\n## 23개 그룹 중 7개는 도봉구에 있다\n\n적격 그룹은 도봉구가 7개, 은평구와 중랑구가 각각 3개이며, 전체 목록은 11개 자치구에 걸쳐 있습니다. 이는 최근 거래량, 면적, 가격의 특정 조합이 필터를 통과한 위치를 보여줍니다. 서울의 저렴한 주택 전체가 어디에 집중돼 있는지를 보여주는 자료는 아닙니다.\n\n적격 그룹이 없는 자치구에도 예산에 맞는 주택은 있을 수 있습니다. 거래가 적거나, 8월 관측치가 없거나, 선택한 면적 구간 밖의 주택일 수 있습니다. 거래 5건 기준은 근거가 적은 사례를 의도적으로 제외하므로, 기사에 없다고 해서 해당 자치구의 집값을 감당할 수 없다는 증거는 아닙니다.\n\n## 최근 실거래 후보 전체 목록\n\n조건을 충족한 원자료상 아파트 그룹 23개를 두 달간 중앙값 순으로 모두 제시합니다. 아파트 이름을 누르면 건물 상세정보가, 지도를 누르면 서울 탐색에서 해당 건물이 열립니다. KRW 1 billion은 10억원, KRW 757 million은 7.57억원입니다. 정확한 단지를 찾을 수 있도록 이름은 신고된 한국어 명칭을 유지했습니다. 마지막 열은 해당 그룹의 가장 최근 기록된 계약일에 관측된 거래이며 호가가 아닙니다. 같은 날짜에 여러 세대가 거래됐을 수도 있습니다.\n\n| 자치구 · 동 | 아파트 | 7~8월 중앙값 (백만원) | 10억원 이하 / 전체 거래 | 최근 관측 거래: 날짜 · 백만원 |\n|---|---|---:|---:|---|\n| 도봉구 방학동 | [우성아파트2](/kr/seoul/explore/dobong-gu/dobong-gu-1ukoxf9/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=dobong-gu&neighborhood=dobong-gu-dong-umib2y&buildingId=dobong-gu-1ukoxf9&view=map) | 543.5 | 6 / 6 | 2026-08-28 · 574.0 |\n| 서대문구 홍은동 | [극동](/kr/seoul/explore/seodaemun-gu/seodaemun-gu-kshyjh/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=seodaemun-gu&neighborhood=seodaemun-gu-dong-1icep37&buildingId=seodaemun-gu-kshyjh&view=map) | 549.0 | 7 / 7 | 2026-08-03 · 500.0 |\n| 도봉구 방학동 | [청구아파트](/kr/seoul/explore/dobong-gu/dobong-gu-1o1u9dz/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=dobong-gu&neighborhood=dobong-gu-dong-umib2y&buildingId=dobong-gu-1o1u9dz&view=map) | 569.0 | 12 / 12 | 2026-08-14 · 640.0 |\n| 도봉구 도봉동 | [럭키](/kr/seoul/explore/dobong-gu/dobong-gu-8a9xo4/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=dobong-gu&neighborhood=dobong-gu-dong-wpibrp&buildingId=dobong-gu-8a9xo4&view=map) | 577.0 | 5 / 5 | 2026-08-20 · 630.0 |\n| 금천구 시흥동 | [관악산벽산타운5](/kr/seoul/explore/geumcheon-gu/geumcheon-gu-8fh0se/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=geumcheon-gu&neighborhood=geumcheon-gu-dong-1fta2k9&buildingId=geumcheon-gu-8fh0se&view=map) | 580.0 | 13 / 13 | 2026-08-20 · 565.0 |\n| 도봉구 방학동 | [신동아아파트1](/kr/seoul/explore/dobong-gu/dobong-gu-slltg2/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=dobong-gu&neighborhood=dobong-gu-dong-umib2y&buildingId=dobong-gu-slltg2&view=map) | 605.0 | 6 / 6 | 2026-08-28 · 665.0 |\n| 은평구 신사동 | [현대2](/kr/seoul/explore/eunpyeong-gu/eunpyeong-gu-1t2u86g/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=eunpyeong-gu&neighborhood=eunpyeong-gu-dong-1yjcf0w&buildingId=eunpyeong-gu-1t2u86g&view=map) | 647.0 | 6 / 6 | 2026-08-01 · 650.0 |\n| 도봉구 도봉동 | [한신](/kr/seoul/explore/dobong-gu/dobong-gu-onrorx/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=dobong-gu&neighborhood=dobong-gu-dong-wpibrp&buildingId=dobong-gu-onrorx&view=map) | 647.5 | 16 / 16 | 2026-08-25 · 640.0 |\n| 도봉구 창동 | [대우](/kr/seoul/explore/dobong-gu/dobong-gu-y714jn/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=dobong-gu&neighborhood=dobong-gu-dong-dsi74z&buildingId=dobong-gu-y714jn&view=map) | 714.5 | 6 / 6 | 2026-08-10 · 729.0 |\n| 중랑구 신내동 | [중앙하이츠](/kr/seoul/explore/jungnang-gu/jungnang-gu-10suics/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=jungnang-gu&neighborhood=jungnang-gu-dong-1n5vv6g&buildingId=jungnang-gu-10suics&view=map) | 715.0 | 10 / 10 | 2026-08-29 · 750.0 |\n| 관악구 신림동 | [관악산휴먼시아2단지](/kr/seoul/explore/gwanak-gu/gwanak-gu-19as52v/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=gwanak-gu&neighborhood=gwanak-gu-dong-ap0crk&buildingId=gwanak-gu-19as52v&view=map) | 757.0 | 7 / 7 | 2026-08-25 · 779.0 |\n| 구로구 오류동 | [영풍마드레빌](/kr/seoul/explore/guro-gu/guro-gu-frk0wo/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=guro-gu&neighborhood=guro-gu-dong-1rjtgfs&buildingId=guro-gu-frk0wo&view=map) | 807.5 | 6 / 6 | 2026-08-06 · 805.0 |\n| 강북구 미아동 | [에스케이북한산시티](/kr/seoul/explore/gangbuk-gu/gangbuk-gu-1ftgkt1/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=gangbuk-gu&neighborhood=gangbuk-gu-dong-170snog&buildingId=gangbuk-gu-1ftgkt1&view=map) | 846.5 | 12 / 12 | 2026-08-18 · 830.0 |\n| 도봉구 창동 | [태영데시앙](/kr/seoul/explore/dobong-gu/dobong-gu-1orwuo7/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=dobong-gu&neighborhood=dobong-gu-dong-dsi74z&buildingId=dobong-gu-1orwuo7&view=map) | 860.0 | 5 / 5 | 2026-08-10 · 845.0 |\n| 중랑구 상봉동 | [건영2차아파트](/kr/seoul/explore/jungnang-gu/jungnang-gu-rqy6en/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=jungnang-gu&neighborhood=jungnang-gu-dong-1i96wj6&buildingId=jungnang-gu-rqy6en&view=map) | 862.5 | 6 / 6 | 2026-08-12 · 900.0 |\n| 노원구 상계동 | [중계센트럴파크](/kr/seoul/explore/nowon-gu/nowon-gu-1i6e9ne/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=nowon-gu&neighborhood=nowon-gu-dong-14qh1w3&buildingId=nowon-gu-1i6e9ne&view=map) | 900.0 | 5 / 5 | 2026-08-17 · 930.0 |\n| 노원구 중계동 | [한화꿈에그린](/kr/seoul/explore/nowon-gu/nowon-gu-1abtsvn/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=nowon-gu&neighborhood=nowon-gu-dong-szuh43&buildingId=nowon-gu-1abtsvn&view=map) | 910.0 | 5 / 5 | 2026-08-14 · 920.0 |\n| 은평구 응암동 | [백련산힐스테이트1차](/kr/seoul/explore/eunpyeong-gu/eunpyeong-gu-f9nn7b/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=eunpyeong-gu&neighborhood=eunpyeong-gu-dong-1sk7t6b&buildingId=eunpyeong-gu-f9nn7b&view=map) | 940.0 | 5 / 5 | 2026-08-15 · 940.0 |\n| 은평구 응암동 | [백련산힐스테이트3차](/kr/seoul/explore/eunpyeong-gu/eunpyeong-gu-qnk78p/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=eunpyeong-gu&neighborhood=eunpyeong-gu-dong-1sk7t6b&buildingId=eunpyeong-gu-qnk78p&view=map) | 940.0 | 6 / 6 | 2026-08-12 · 940.0 |\n| 강서구 마곡동 | [마곡금호어울림](/kr/seoul/explore/gangseo-gu/gangseo-gu-dh0yym/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=gangseo-gu&neighborhood=gangseo-gu-dong-1bs4mqp&buildingId=gangseo-gu-dh0yym&view=map) | 950.0 | 5 / 5 | 2026-08-17 · 950.0 |\n| 성북구 돈암동 | [한진(609-1)](/kr/seoul/explore/seongbuk-gu/seongbuk-gu-1i6lp9w/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=seongbuk-gu&neighborhood=seongbuk-gu-dong-1m7vccg&buildingId=seongbuk-gu-1i6lp9w&view=map) | 970.0 | 4 / 7 | 2026-08-06 · 970.0 |\n| 금천구 시흥동 | [남서울힐스테이트](/kr/seoul/explore/geumcheon-gu/geumcheon-gu-fn0ic5/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=geumcheon-gu&neighborhood=geumcheon-gu-dong-1fta2k9&buildingId=geumcheon-gu-fn0ic5&view=map) | 982.5 | 6 / 6 | 2026-08-13 · 970.0 |\n| 중랑구 중화동 | [한신아파트상가동유치원동(103~109)](/kr/seoul/explore/jungnang-gu/jungnang-gu-fpwaj/?transaction=sale&area=60-85&propertyType=apartment) · [지도](/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment&district=jungnang-gu&neighborhood=jungnang-gu-dong-1x6liyb&buildingId=jungnang-gu-fpwaj&view=map) | 990.0 | 5 / 6 | 2026-08-27 · 1,000.0 |\n\n일부 원자료 식별자에는 어색한 단지명이 붙어 있고, 하나의 실제 단지에 여러 식별자가 있을 수 있습니다. 행 하나를 특정 부동산으로 판단하기 전에 동, 주소, 세대를 대조해야 합니다. 이 표는 원자료 그룹을 세며, 서로 다른 실제 단지 23개임을 인증하지 않습니다.\n\n건물 링크는 더 넓은 60~85㎡ 구간의 매매 근거를 엽니다. 상세 페이지에는 자체 자료 기간과 필터가 표시되므로, 이 기사의 7~8월·84~85㎡ 기준과 수치가 다를 수 있습니다. 지도는 선택한 건물을 열지만, 정확한 핀은 검증된 좌표가 있어야 하며 제공되지 않을 수도 있습니다. 링크는 실거래 근거를 보여주며 현재 매물 목록이 아닙니다.\n\n## 중앙값 뒤에 있는 가격 범위\n\n| 아파트 | 건축연도 | 7~8월 최저~최고 (백만원) | 중앙값 (백만원) | 거래 수 |\n|---|---:|---:|---:|---:|\n| 우성아파트2 | 1993 | 530.0–574.0 | 543.5 | 6 |\n| 한신 | 1995 | 555.0–682.0 | 647.5 | 16 |\n| 관악산휴먼시아2단지 | 2008 | 740.0–779.0 | 757.0 | 7 |\n| 에스케이북한산시티 | 2004 | 810.0–923.0 | 846.5 | 12 |\n| 백련산힐스테이트1차 | 2011 | 920.0–945.0 | 940.0 | 5 |\n| 남서울힐스테이트 | 2014 | 920.0–997.0 | 982.5 | 6 |\n\n매물을 평가할 때는 가격 분포도 중요합니다. 에스케이북한산시티의 적격 거래 12건은 8억 1,000만~9억 2,300만원으로, 같은 두 달과 좁은 면적 구간 안에서 1억 1,300만원 차이가 났습니다. 따라서 호가가 중앙값보다 높다고 해서 관측 범위 밖이라고 단정할 수 없습니다. 반대로 그 범위 안에 있다고 해서 다른 세대의 적정 가격임이 입증되는 것도 아닙니다.\n\n도봉동 한신의 거래 16건은 5억 5,500만~6억 8,200만원이었습니다. 자료는 이 차이 중 층, 상태, 향, 시점이 각각 얼마나 영향을 미쳤는지 분리하지 않습니다. 중앙값을 협상 목표로 삼기 전에 실제로 비교 가능한 거래 세대가 무엇인지 확인해야 합니다.\n\n건축연도는 주택 상품을 구분하는 데 도움이 되지만, 수리 품질이나 특정 세대의 상태를 입증하지 않습니다. 이 표의 1993년 건물과 2014년 건물을 같은 예산 기준을 통과했다는 이유만으로 동등하게 취급해서는 안 됩니다.\n\n## 최근 계약일이 중앙값만큼 중요한 이유\n\n7월에만 거래된 단지가 목록에 들어오지 않도록 8월 거래를 필수로 했습니다. 예를 들어 항동제일풍경채포레스트는 7~8월 적격 거래 5건, 중앙값 7억 2,400만원이었지만 가장 최근 관측 계약일이 7월 28일이어서 표에서 제외됐습니다.\n\n8월 거래도 과거의 근거입니다. 호가가 달라졌을 수 있고, 해당 주택은 이미 팔렸으며, 다음 세대는 층·상태·평면이 다를 수 있습니다. 이 기준은 현재 매물을 조사할 곳을 알려줄 뿐, 매물 확인을 대신하지 않습니다.\n\n중앙값에는 거래 건수도 함께 봐야 합니다. 돈암동 한진(609-1)의 중앙값은 9억 7,000만원이었지만 적격 거래 7건 중 10억원 이하는 4건뿐이었습니다. 기준을 통과한 그룹에도 예산을 벗어나는 주택이 포함될 수 있습니다.\n\n## 현재 집을 찾을 때 이 목록을 활용하는 방법\n\n실제로 살고 싶은 위치부터 정하세요. 현재 부동산 매물 서비스에서 정확한 아파트 이름과 동을 대조한 뒤 세대의 면적, 층, 상태, 호가, 매수 가능 여부를 확인하세요. 중앙값을 실현 가능한 제안가로 가정하지 말고, 날짜가 명시된 실거래 근거와 비교하세요.\n\n취득 비용은 별도로 예산에 반영하고, 매수자와 주택에 적용되는 자금 조달 조건 및 필요한 매수 허가를 확인하세요. 거래 자료만으로 매수 자격이나 대출 가능 금액을 알 수는 없습니다. 여기서는 대출액, 투자 수익률, 미래 가격을 추정하지 않습니다.\n\n## 방법, 자료 시점, 출처\n\n출처는 2026년 9월 7일 수집한 국토교통부 아파트 매매 상세자료입니다. 계약일이 2026년 7월 1일~8월 31일인 중개거래 중 전용면적 84㎡ 이상 85㎡ 미만, 3층 이상을 남겼습니다. 스냅샷에 해제로 표시된 기록은 제외했습니다. 원자료의 아파트 식별자로 그룹을 묶었으며, 표본 수가 짝수일 때 중앙값은 가운데 두 가격의 평균입니다. 포함된 서로 다른 면적 유형과 세대 특성에 대한 품질 조정은 하지 않았습니다.\n\n게재 기준은 적격 거래 5건, 10억원 이하 거래 3건, 10억원 이하 중앙값, 8월 계약 최소 1건입니다. 8월 신고는 아직 완결되지 않았을 수 있습니다. 이후 신고, 해제, 정정에 따라 목록과 건수, 가격이 바뀔 수 있습니다. 9월은 수집 당시 진행 중이어서 제외했습니다.\n\n출처: 국토교통부 [아파트 매매 실거래 상세자료 API](https://www.data.go.kr/data/15126468/openapi.do). 자료 목록에는 이용허락 범위에 제한이 없다고 명시돼 있습니다. 계산과 해설은 SignedPrice가 작성하고 출처와 산술을 자동 점검했습니다. 국토교통부가 이 분석을 승인한 것은 아닙니다.\n\n[싱가포르 관련 기사](/ko/news/singapore-condos-under-1-5-million-2026/)는 2026년 상반기 80~100㎡ 콘도 재판매를 S$150만 기준으로 살펴보고 일부 이후 관측치를 덧붙입니다. 기간과 스트라타 면적 기준이 이 서울 분석과 다릅니다. 두 기사는 각 지역의 가격 검색이며 국가 간 주거비 부담 순위가 아닙니다.\n",
    "status": "published",
    "evidenceState": "verified",
    "authorName": "SignedPrice 데이터팀",
    "reviewedAt": "2026-09-07T04:00:00.000Z",
    "reviewedBy": "SignedPrice 출처 및 계산 자동 점검",
    "publishedAt": "2026-09-07T00:00:00.000Z",
    "updatedAt": "2026-09-07T04:00:00.000Z",
    "relatedHref": "/ko/news/singapore-condos-under-1-5-million-2026/",
    "sources": [
      {
        "id": "molit-sale-detail",
        "kind": "primary",
        "publisher": "국토교통부",
        "title": "아파트 매매 실거래 상세자료 API",
        "href": "https://www.data.go.kr/data/15126468/openapi.do",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      }
    ],
    "evidenceReleaseIds": [
      "molit-seoul-sales-2026-09-07"
    ],
    "revisionNote": "최초 게재 후 7~8월 거래를 우선하고 8월 관측을 필수로 하도록 수정했으며, 최근 실거래 후보와 현재 매물을 구분했습니다. 최근 거래 후보 23개 모두에 신원을 대조한 건물 상세 및 지도 링크를 추가했습니다. 예산 구간, 관측 가격 비교, 매수자를 위한 근거의 한계를 확장했습니다.",
    "canonicalHref": "/ko/news/seoul-84sqm-under-one-billion-2026/",
    "translationGroupId": "seoul-84sqm-under-one-billion-2026",
    "infographic": {
      "id": "affordable-seoul-84sqm-under-one-billion-2026",
      "template": "district-comparison",
      "locale": "ko",
      "title": "선정 사례의 최근 중앙값, 2026년 7~8월",
      "accessibleSummary": "2026년 7~8월 반복 거래와 8월 거래 최소 1건이 확인된 아파트 그룹 23개. 날짜와 표본 수를 갖춘 최근 가격으로 주택 검색을 시작합니다.",
      "evidenceReleaseIds": [
        "molit-seoul-sales-2026-09-07"
      ],
      "unit": "KRW million",
      "period": {
        "start": "2026-07-01",
        "end": "2026-08-31"
      },
      "series": [
        {
          "id": "median",
          "label": "7~8월 중앙값",
          "values": [
            {
              "label": "우성아파트2",
              "value": 543.5,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            },
            {
              "label": "한신",
              "value": 647.5,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            },
            {
              "label": "관악산휴먼시아2단지",
              "value": 757,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            },
            {
              "label": "에스케이북한산시티",
              "value": 846.5,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            },
            {
              "label": "남서울힐스테이트",
              "value": 982.5,
              "evidenceReleaseId": "molit-seoul-sales-2026-09-07"
            }
          ]
        }
      ],
      "sourceLabel": "국토교통부 신고 실거래; SignedPrice 계산",
      "sampleLabel": "기사 기준을 충족한 선정 사례; 그룹별 적격 거래 5건 이상",
      "relatedHref": "/kr/seoul/explore/?transaction=sale&area=60-85&propertyType=apartment",
      "conversionProvenance": null
    }
  },
  {
    "id": "ko:singapore-condos-under-1-5-million-2026",
    "slug": "singapore-condos-under-1-5-million-2026",
    "locale": "ko",
    "marketId": "sg-singapore",
    "type": "data-story",
    "title": "싱가포르 S$150만 이하 콘도: 재판매 근거가 있는 18개 단지",
    "deck": "2026년 상반기 80~100㎡ 기준을 통과한 단지 18개. Melville Park의 적격 재판매 10건은 모두 S$100만 미만이었습니다.",
    "readerQuestion": "싱가포르 S$150만 이하 콘도: 재판매 근거가 있는 18개 단지",
    "bodyMarkdown": "## S$100만 미만 민간 콘도, 한 단지에서 거래 10건\n\nMelville Park는 2026년 상반기에 조건에 맞는 80~100㎡ 콘도 재판매 10건을 기록했습니다. 모두 S$100만 미만으로, 가격 범위는 S$888,000~S$981,000, 중앙값은 S$922,500이었습니다. 실제 거래 면적은 87~93㎡였습니다.\n\n가격 질문에 대한 구체적인 답이지만 중요한 조건이 있습니다. 원자료상 임차권은 1992년 시작된 99년형입니다. 오래된 임차권 콘도는 신규 분양이나 영구보유권 단지와 주거 조건이 다릅니다. 관측된 가격 차이가 가격 오류의 증거는 아닙니다.\n\n## 예산을 S$250,000 늘리면 무엇이 추가될까?\n\n| 단지 중앙값 구간 | 적격 그룹 수 | 해당 그룹 거래 수 |\n|---|---:|---:|\n| S$100만 이하 | 1 | 10 |\n| S$100만 초과~S$125만 이하 | 10 | 69 |\n| S$125만 초과~S$150만 이하 | 7 | 59 |\n\n적격 표본에서 중앙값이 S$100만 이하인 곳은 Melville Park뿐입니다. 다음 S$250,000 구간에는 10개 단지, 마지막 구간에는 7개가 있습니다. 단지 중앙값에 따른 구간이며, 그 예산에 매도 중인 개별 주택 수가 아닙니다. 적격 단지 18개를 나눈 것으로 싱가포르 시장 전체를 설명하지 않습니다.\n\nS$100만에서 S$125만으로 올라가면 이 표본의 선택지가 상당히 늘어납니다. 그렇다고 단지들이 서로 대체 가능하다는 뜻은 아닙니다. 표에는 우편구역, 임차권 시작 연도, 거래 면적이 서로 다른 단지들이 있습니다. 다음으로 물어야 할 것은 어느 단지의 숫자가 가장 낮은지보다 어떤 절충이 가구의 필요에 맞는지입니다.\n\n## S$150만 기준을 통과한 단지 18개\n\n2026년 상반기 단지별 적격 재판매가 5건 이상이고, 중앙값이 S$150만 이하이며, 해당 금액 이하 거래가 3건 이상인 곳을 찾았습니다. 18개 단지가 통과했고 적격 재판매 138건이 포함됐으며, 그중 135건이 S$150만 이하였습니다.\n\n민간 콘도 재판매만 포함합니다. HDB 주택, 이그제큐티브 콘도, 아파트로 분류된 기록, 토지부 주택, 신규 분양 및 전매는 제외합니다. 표는 투자 매력이 아닌 계약가격 중앙값 순입니다.\n\n| 콘도 | 우편구역 | 거래 면적 (㎡) | 상반기 중앙값 (S$) | S$150만 이하 / 전체 거래 | 원자료상 보유권 |\n|---|---:|---:|---:|---:|---|\n| [Melville Park](/sg/singapore/explore/ocr/39396ccb6f4c7cd1b2a24f610243db205892d0c9b662a959356f31964207cbb7/) | 18 | 87–93 | 922,500 | 10 / 10 | 1992년 시작 99년 임차권 |\n| [The Miltonia Residences](/sg/singapore/explore/ocr/496fae2b5e7990599ebff4d927f5748d1d52d154805f1544701eda6ee5cb2e70/) | 27 | 80–93 | 1,060,688 | 7 / 7 | 2010년 시작 99년 임차권 |\n| [Regent Heights](/sg/singapore/explore/ocr/3b8ade1fbe3557fb46a7f4f79c3312539e99688565e7e97c53916e748c42bc84/) | 23 | 95–95 | 1,062,500 | 10 / 10 | 1995년 시작 99년 임차권 |\n| [Eastpoint Green](/sg/singapore/explore/ocr/32187ebf1172f1fd4882df5c18cf5e4c1bc607170a3e4ec27c721c9ecc0ed461/) | 18 | 89–90 | 1,160,000 | 5 / 5 | 1996년 시작 99년 임차권 |\n| [Parc Vista](/sg/singapore/explore/ocr/4085ec8fb1efe77ef9d1e8b3aaf3e803a99c1192157447c0c7528e722b42e99e/) | 22 | 97–100 | 1,165,000 | 7 / 7 | 1995년 시작 99년 임차권 |\n| [Carissa Park Condominium](/sg/singapore/explore/ocr/cb46c4a6ddfe5fe26988e7cdad25f0eed2daa7e791dc6f7fbb585af019fa7f68/) | 17 | 86–88 | 1,180,000 | 5 / 5 | 영구보유권 |\n| [The Greenwich](/sg/singapore/explore/ocr/e300eb33dd52b47b82caf410ce4a0472008b3cfb816f2503b06838d3d56e40f8/) | 28 | 82–100 | 1,190,000 | 5 / 5 | 2009년 시작 99년 임차권 |\n| [Aquarius By The Park](/sg/singapore/explore/ocr/a58279c2e32c6d1e8dca3f066e59e9733b25220692fe5142414a28fa3582dee8/) | 16 | 83–83 | 1,195,000 | 6 / 6 | 1996년 시작 99년 임차권 |\n| [Bayshore Park](/sg/singapore/explore/ocr/856e63bce148ba868dd132095444338fe76751774f83feb12aecebb6ac0eebae/) | 16 | 87–87 | 1,214,444 | 6 / 6 | 1982년 시작 99년 임차권 |\n| [Symphony Suites](/sg/singapore/explore/ocr/48a789730fa039fa28efe10691bbb29e26e8146caf03fdcf899f070eddc9b848/) | 27 | 83–95 | 1,235,000 | 12 / 12 | 2014년 시작 99년 임차권 |\n| [The Warren](/sg/singapore/explore/ocr/c57e04000a51b8825ce4f76892f0301163f68c47a42ec48f5118f1788c6f0000/) | 23 | 97–99 | 1,239,444 | 6 / 6 | 2001년 시작 99년 임차권 |\n| [Castle Green](/sg/singapore/explore/ocr/d39362b0d05daaf6d54ef0678cee1e477baedbfeebd5e2970c8ca4e507e454df/) | 26 | 88–88 | 1,280,000 | 6 / 6 | 1993년 시작 99년 임차권 |\n| [The Bayshore](/sg/singapore/explore/ocr/16c450ff1acbb11b0d5d58865f7b751e99fbb47f0678ee9b47f448169beb42ab/) | 16 | 86–94 | 1,293,000 | 13 / 13 | 1993년 시작 99년 임차권 |\n| [Riversails](/sg/singapore/explore/ocr/989402a0b8ff065d073c87949c16747690928daf7153dcc16405ead03e3ba2d0/) | 19 | 82–99 | 1,370,944 | 6 / 8 | 2011년 시작 99년 임차권 |\n| [Dover Parkview](/sg/singapore/explore/rcr/2168d83592b71630c55d2c193f5513494df5f6129ad8bfd77f8360b619b76844/) | 05 | 87–90 | 1,375,000 | 14 / 14 | 1993년 시작 99년 임차권 |\n| [Hedges Park Condominium](/sg/singapore/explore/ocr/a36cae646d04d6cedc2bec9d6f784557fab8ccdfb7f0e944075276a04694bde4/) | 17 | 90–100 | 1,375,000 | 6 / 6 | 2010년 시작 99년 임차권 |\n| [Double Bay Residences](/sg/singapore/explore/ocr/5fd74bb85d82bd629de73e32a4d6c1785212c5b363d9db938b52c7d1a2d3666f/) | 18 | 87–93 | 1,450,000 | 7 / 7 | 2008년 시작 99년 임차권 |\n| [Flo Residence](/sg/singapore/explore/ocr/25fee1ae7d0a7712353521eb3139de28838b79de65944589b30aeaa69d9e2358/) | 19 | 86–94 | 1,472,000 | 4 / 5 | 2011년 시작 99년 임차권 |\n\n이 표에서 영구보유권으로 기재된 곳은 Carissa Park 한 곳입니다. 적격 재판매 5건의 중앙값은 S$118만이었습니다. 이는 영구보유권의 가치만 분리한 수치가 아닙니다. 위치, 단지 연식, 세대 특성 등 다른 차이가 비교에 섞여 있습니다.\n\n## 가격 기준선은 다음 거래에 대한 약속이 아니다\n\nRiversails의 상반기 중앙값은 S$1,370,944였지만 적격 재판매 8건 중 2건은 S$150만을 넘었습니다. Flo Residence에도 기준을 넘는 거래 1건이 포함됐습니다. 중앙값 기준을 통과했다고 해서 모든 적격 주택이 예산 아래에서 팔렸다는 뜻은 아닙니다.\n\n7~8월 기록으로 한 번 더 확인할 수 있습니다. Melville Park는 적격 재판매 5건, 중앙값 S$925,000이었습니다. Riversails는 2건, 중앙값 S$1,520,000으로 이미 기사의 기준선을 넘었습니다. 이 이후 표본은 작고 서로 다른 주택으로 구성돼 있으므로, 품질을 조정한 가격지수도 현재 매수 가능성에 대한 보장도 아닙니다.\n\n## 이후 거래에서 확인되는 내용\n\n| 콘도 | 상반기 중앙값 | 상반기 거래 수 | 7~8월 중앙값 | 7~8월 거래 수 |\n|---|---:|---:|---:|---:|\n| [Melville Park](/sg/singapore/explore/ocr/39396ccb6f4c7cd1b2a24f610243db205892d0c9b662a959356f31964207cbb7/) | S$922,500 | 10 | S$925,000 | 5 |\n| [Regent Heights](/sg/singapore/explore/ocr/3b8ade1fbe3557fb46a7f4f79c3312539e99688565e7e97c53916e748c42bc84/) | S$1,062,500 | 10 | S$1,038,000 | 4 |\n| [Symphony Suites](/sg/singapore/explore/ocr/48a789730fa039fa28efe10691bbb29e26e8146caf03fdcf899f070eddc9b848/) | S$1,235,000 | 12 | S$1,270,000 | 3 |\n| [The Bayshore](/sg/singapore/explore/ocr/16c450ff1acbb11b0d5d58865f7b751e99fbb47f0678ee9b47f448169beb42ab/) | S$1,293,000 | 13 | S$1,260,000 | 7 |\n| [Flo Residence](/sg/singapore/explore/ocr/25fee1ae7d0a7712353521eb3139de28838b79de65944589b30aeaa69d9e2358/) | S$1,472,000 | 5 | S$1,450,000 | 3 |\n| [Riversails](/sg/singapore/explore/ocr/989402a0b8ff065d073c87949c16747690928daf7153dcc16405ead03e3ba2d0/) | S$1,370,944 | 8 | S$1,520,000 | 2 |\n\n첫 5개 행은 후보 목록 중 7~8월 적격 재판매가 3건 이상인 단지 전체입니다. Riversails는 이후 관측 2건이 예산 경계를 넘는 사례를 보여줘 추가했으며, 거래 2건으로 추세를 입증해서가 아닙니다. 다른 후보 단지는 이 스냅샷에서 이후 관측치가 3건 미만이거나 없습니다.\n\nMelville Park의 이후 중앙값은 상반기 수준에 가깝고, The Bayshore는 낮으며 Symphony Suites는 높습니다. 각 기간에 거래된 세대가 다릅니다. 이를 단지별 투자 수익률로 읽으면 자료의 입증 범위를 과장하게 됩니다. 동일 조건 세대를 맞춘 더 좁은 비교가 필요합니다.\n\n이후 기간이 비어 있다고 해서 가격이 변하지 않았거나 매물이 없었다는 증거는 아닙니다. 이 스냅샷은 어떤 적격 거래가 신고돼 있는지만 알려줍니다.\n\n## 비슷한 가격이라도 주택은 매우 다를 수 있다\n\n| 비교 | 관측 근거 | 추가 확인 사항 |\n|---|---|---|\n| Regent Heights와 The Miltonia Residences | 상반기 중앙값은 각각 S$1,062,500과 S$1,060,688, 거래 면적은 각각 95㎡와 80~93㎡ | 가격은 비슷하지만 관측된 세대 면적은 같지 않으므로 평면과 면적을 맞춰 비교해야 함 |\n| Carissa Park와 The Greenwich | 상반기 중앙값 S$118만과 S$119만, 원자료상 권리는 각각 영구보유권과 2009년 시작 99년 임차권 | 영구보유권 프리미엄 추정치가 아니며 위치·건물·세대 차이가 남아 있음 |\n| Bayshore Park와 The Bayshore | 상반기 중앙값 S$1,214,444와 S$1,293,000, 임차권 시작 연도 1982년과 1993년 | 비슷한 이름이 같은 단지나 임차권을 뜻하지 않으므로 정확한 단지와 권리관계를 확인해야 함 |\n\n첫 번째 비교는 특히 유용합니다. 거의 같은 총가격으로 살 수 있는 신고 스트라타 면적이 다를 수 있습니다. 전체 표는 모든 거래를 표준 크기의 침실 2개 또는 3개 주택으로 가정하지 않고 단지별 관측 면적 범위를 보여줍니다.\n\n방문 전에 단지, 세대 면적, 층 구간을 대조하고 표시 가격에 무엇이 포함되는지 물으며 해당 세대의 상태와 현재 매수 가능 여부를 확인하세요. 이어 적절한 서류로 단지의 현재 관리비와 관련 예정 공사를 확인하세요. 이 거래 분석은 그런 비용과 상태를 제공하지 않으므로 어느 단지도 관리비가 적다거나 문제가 없다고 표현하지 않습니다.\n\n## 예산에 포함되지 않은 것\n\n표에는 인지세, 자금 조달, 기타 매수 비용을 제외한 계약가격이 담겨 있습니다. 매수자의 상황에 따라 총비용이 크게 달라질 수 있으므로 [IRAS 추가 매수자 인지세 안내](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29)에서 적용 기준을 확인하세요. 개인별 총예산이나 매수 자격은 계산하지 않았습니다.\n\n80~100㎡ 구간에도 다양한 세대 면적과 평면이 포함됩니다. 침실 수를 확정할 수 없습니다. 층 구간 등 세대 속성도 다르며 이 분석은 이에 대해 가격을 조정하지 않습니다. 신고된 임차권 시작일은 특정 권리나 잔여 임차기간에 대한 법적 검증이 아닙니다.\n\n## S$150만은 매매가격 상한인가, 총예산인가?\n\nS$150만 주거용 부동산 매수를 가정하고 시장가치가 합의 가격과 같다고 하겠습니다. [IRAS BSD 구간](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29)에 따르면 S$1,800 + S$3,600 + S$19,200 + S$20,000 = S$44,600입니다.\n\n감면 없이 표준 60% [ABSD 세율](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29)이 적용되는 외국인 개인에게는 ABSD S$900,000이 추가됩니다. 가격과 두 세금의 합계는 법률 업무, 자금 조달, 기타 비용 전 S$2,444,600입니다. 2026년 9월 7일 확인한 예시 세금 계산이며 개인별 산정은 아닙니다.\n\n| 항목 | 가격 S$150만일 때 | 가격 S$920,000일 때 |\n| --- | --- | --- |\n| 매매가격 | S$1,500,000 | S$920,000 |\n| BSD | S$44,600 | S$22,200 |\n| 60% 가정 ABSD | S$900,000 | S$552,000 |\n| 가격과 세금 합계 | S$2,444,600 | S$1,494,200 |\n\nS$920,000 예시에서는 누락된 비용을 반영하기 전에도 S$150만 총예산에서 S$5,800만 남습니다. 승인된 매수 한도나 실제 매물이 아닙니다. 따라서 기사에서 가장 낮은 단지 중앙값에 가까운 가격이라도, 명시한 세금 조건에서는 예산 대부분을 소진할 수 있습니다.\n\n모든 해외 독자에게 60%를 적용해서는 안 됩니다. [IRAS FTA 감면 안내](https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29)는 요건을 충족하는 아이슬란드·리히텐슈타인·노르웨이·스위스의 국민 및 영주권자와 미국 국민에게 싱가포르 시민과 같은 인지세 대우를 제공합니다. 개인 조건에 따른 적용이며 모든 매수에 대한 무조건 면제는 아닙니다. 단지를 추릴 예산을 정하기 전에 본인의 상황을 확인하세요.\n\n대출은 매수 자금 조달 방식을 바꾸지만 가격과 세금의 합계를 바꾸지는 않습니다. 취득비 계산 옆에 확정된 대출금, 현금 지급일, 별도 예비자금을 함께 정리하세요. 금융기관의 승인과 해당 부동산의 적격 여부는 별도로 확인해야 합니다.\n\n## 단지 목록을 방문 점검표로 바꾸기\n\n수정한 매매가격 예산에 맞는 단지 2~3곳을 고르세요. 실제 세대별로 호가, 면적, 층 구간, 보유권 유형, 현재 매수 가능 여부를 기록하고 최근의 비교 가능한 재판매 근거와 대조하세요. 상반기와 7~8월 표본은 별도 열로 유지하세요.\n\n현재 관리비 고지서와 예정 공사를 확인하고 실제 출퇴근 시간에 집에서 목적지까지 이동해 보세요. 단지 중앙값은 이런 질문에 답하지 못합니다. [싱가포르 탐색](/sg/singapore/explore/)으로 단지를 좁히고 [싱가포르 가격 확인](/sg/singapore/check/)으로 가격 맥락을 살펴보세요. 어느 결과도 앞서 설명한 매수자 조건별 비용 계산을 대신하지 않습니다.\n\n## 집계 방법과 데이터 출처\n\n2026년 9월 2일 생성돼 설치된 URA 기반 민간 매매 스냅샷에서 계약월 2026년 1~6월을 사용해 다시 계산했습니다. 콘도로 분류되고 스트라타 면적이 80~100㎡ 양끝값을 포함하는 단일 세대 재판매 기록을 남겨 단지 식별자로 묶었습니다. 가격 단위는 싱가포르 달러입니다. 거래 건수가 짝수면 중앙값은 가운데 두 가격의 평균입니다. 7~8월 점검에는 같은 필터와 이후 계약월을 적용합니다.\n\n신고 거래를 고정한 스냅샷이며 실시간 매물 피드가 아닙니다. 이후 정정이나 지연 신고에 따라 표본이 바뀔 수 있습니다. 계산과 해설은 SignedPrice가 작성하고 출처 및 산술을 자동 점검했습니다.\n\n2026년 9월 2일 스냅샷에서 접근한 도시재개발청(URA) 정보를 포함하며, [싱가포르 오픈 데이터 라이선스](https://data.gov.sg/open-data-licence)에 따라 제공됩니다. [URA 부동산 데이터](https://www.ura.gov.sg/property-data/)와 [URA API 이용약관](https://www.ura.gov.sg/eservices-info/maps/api-terms-of-service/)을 참고하세요. URA가 이 분석을 승인한 것은 아닙니다.\n\n[서울 관련 기사](/ko/news/seoul-84sqm-under-one-billion-2026/)는 2026년 7~8월 신고된 전용 84㎡ 아파트 매매를 10억원 기준으로 살펴봅니다. 관측 기간이 이 싱가포르 분석과 다릅니다. 한국 전용면적과 싱가포르 스트라타 면적은 서로 바꿔 쓸 수 없습니다. 각각의 지역 가격 기준이며 환율 환산이나 어느 시장의 주거비 부담이 더 낮다는 주장은 하지 않습니다.\n",
    "status": "published",
    "evidenceState": "verified",
    "authorName": "SignedPrice 데이터팀",
    "reviewedAt": "2026-09-07T05:57:26.000Z",
    "reviewedBy": "SignedPrice 출처 및 계산 자동 점검",
    "publishedAt": "2026-09-07T00:00:00.000Z",
    "updatedAt": "2026-09-07T05:57:26.000Z",
    "relatedHref": "/ko/news/seoul-84sqm-under-one-billion-2026/",
    "sources": [
      {
        "id": "ura-property-data",
        "kind": "primary",
        "publisher": "도시재개발청(URA)",
        "title": "민간 주거용 부동산 데이터",
        "href": "https://www.ura.gov.sg/property-data/",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      },
      {
        "id": "sg-open-data-licence",
        "kind": "primary",
        "publisher": "싱가포르 정부",
        "title": "싱가포르 오픈 데이터 라이선스",
        "href": "https://data.gov.sg/open-data-licence",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      },
      {
        "id": "ura-api-terms",
        "kind": "primary",
        "publisher": "도시재개발청(URA)",
        "title": "API 이용약관",
        "href": "https://www.ura.gov.sg/eservices-info/maps/api-terms-of-service/",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      },
      {
        "id": "iras-absd",
        "kind": "primary",
        "publisher": "싱가포르 국세청(IRAS)",
        "title": "추가 매수자 인지세",
        "href": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      },
      {
        "id": "iras-bsd",
        "kind": "primary",
        "publisher": "싱가포르 국세청(IRAS)",
        "title": "매수자 인지세: 세율과 계산",
        "href": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      },
      {
        "id": "iras-fta-remission",
        "kind": "primary",
        "publisher": "싱가포르 국세청(IRAS)",
        "title": "FTA에 따른 ABSD 감면 대상 외국인",
        "href": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29",
        "checkedAt": "2026-09-07",
        "publishedAt": null
      }
    ],
    "evidenceReleaseIds": [
      "installed-sg-private-sale-2026-09-02"
    ],
    "revisionNote": "최초 게재: 날짜가 명시된 거래 기준, 표본 수, 이후 관측치, 재사용 출처 표시를 점검했습니다. 예산 구간, 관측 가격 비교, 매수자를 위한 근거의 한계를 확장했습니다. 확인된 IRAS BSD·ABSD·FTA 안내에 따른 매매가격 대비 총예산 예시와 단지 방문 절차를 추가했으며 원래 거래 표본을 유지했습니다.",
    "canonicalHref": "/ko/news/singapore-condos-under-1-5-million-2026/",
    "translationGroupId": "singapore-condos-under-1-5-million-2026",
    "infographic": {
      "id": "affordable-singapore-condos-under-1-5-million-2026",
      "template": "district-comparison",
      "locale": "ko",
      "title": "선정 단지 중앙값, 2026년 1~6월",
      "accessibleSummary": "2026년 상반기 80~100㎡ 기준을 통과한 단지 18개. Melville Park의 적격 재판매 10건은 모두 S$100만 미만이었습니다.",
      "evidenceReleaseIds": [
        "installed-sg-private-sale-2026-09-02"
      ],
      "unit": "SGD",
      "period": {
        "start": "2026-01-01",
        "end": "2026-06-30"
      },
      "series": [
        {
          "id": "median",
          "label": "상반기 중앙값",
          "values": [
            {
              "label": "Melville Park",
              "value": 922500,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            },
            {
              "label": "The Miltonia Residences",
              "value": 1060688,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            },
            {
              "label": "Regent Heights",
              "value": 1062500,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            },
            {
              "label": "Eastpoint Green",
              "value": 1160000,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            },
            {
              "label": "Parc Vista",
              "value": 1165000,
              "evidenceReleaseId": "installed-sg-private-sale-2026-09-02"
            }
          ]
        }
      ],
      "sourceLabel": "도시재개발청(URA) 신고 실거래; SignedPrice 계산",
      "sampleLabel": "기사 기준을 충족한 선정 사례; 그룹별 적격 거래 5건 이상",
      "relatedHref": "/sg/singapore/explore/",
      "conversionProvenance": null
    }
  }
];
