import { chineseSingaporeCopy } from './market-chinese';
import { marketText, type MarketLocale } from './market-localization';

const copy: Readonly<Record<string, string>> = {
  "Compare an asking price in Singapore | signedprice": "싱가포르 매물 가격 비교 | signedprice",
  "Compare private-home sale prices, HDB resale prices or monthly rents with recent Singapore transactions.": "민간주택 매매가격, HDB 재판매 가격이나 월세를 최근 싱가포르 실거래가와 비교하세요.",
  "Markers use source coordinates. Select a project for its transactions. Projects without exact coordinates stay in the list; area references show their approximate district.": "표시는 원자료의 좌표를 사용합니다. 단지를 선택해 거래를 확인하세요. 정확한 좌표가 없는 단지도 목록에 남으며, 지역 참고 표시를 켜면 대략적인 지구 위치를 볼 수 있습니다.",
  "Transaction records for this comparison are unavailable.": "이 비교에 필요한 거래 자료가 없습니다.",
  "Explore Singapore transactions": "싱가포르 실거래가 탐색",
  "Asking price (SGD)": "매물 가격 (SGD)",
  "Reporting month": "집계 기준 월",
  "Data available": "자료 있음",
  "Price percentile": "가격 백분위",
  "Reporting period": "집계 기간",
  "Middle 50% (P25–P75)": "거래가격 중간 50% 범위 (P25–P75)",
  "Enter an asking price.": "매물 가격을 입력하세요.",
  "Compare the median, middle 50% (P25–P75) and price percentile. Scope, sample, reporting period and source are shown with each result.": "중앙값, 거래가격 중간 50% 범위와 가격 백분위를 비교하세요. 결과마다 비교 조건, 표본 수, 집계 기간과 출처를 함께 표시합니다.",
  "Compare an asking price": "매물 가격 비교",
  "Compare an asking rent": "매물 임대료 비교",
  "Area only": "지역 위치만 확인",
  "approximate area, not project locations": "대략적 지역이며 단지 위치가 아닙니다",
  "new_sale": "신규 분양", "sub_sale": "준공 전 전매", "resale": "재판매",
  "apartment": "아파트", "condominium": "콘도미니엄", "executive_condominium": "이그제큐티브 콘도미니엄",
  "terrace": "테라스 주택", "semi_detached": "반단독 주택", "detached": "단독주택",
  "1 ROOM": "1룸", "2 ROOM": "2룸", "3 ROOM": "3룸", "4 ROOM": "4룸", "5 ROOM": "5룸",
  "1-room": "1룸", "2-room": "2룸", "3-room": "3룸", "4-room": "4룸", "5-room": "5룸",
  "EXECUTIVE": "이그제큐티브", "MULTI-GENERATION": "다세대형", "MULTI GENERATION": "다세대형",

"Verified Singapore evidence unavailable":"검증된 싱가포르 자료를 이용할 수 없습니다","Verified evidence unavailable":"검증된 자료 이용 불가","Private residential sales only; HDB resale and rental evidence is shown in separate layers.":"민간주택 매매 자료만 포함하며 HDB 재판매 및 임대 자료는 별도로 표시합니다.","Reported transactions may be revised; unsupported product claims are not substituted.":"신고 거래는 수정될 수 있으며 자료로 뒷받침되지 않는 주장을 대신 제시하지 않습니다.","PSF is derived from reported SGD price and square metres; PSM uses the same source area basis.":"PSF는 신고된 SGD 가격과 제곱미터 면적으로 계산하며 PSM에도 같은 원본 면적 기준을 적용합니다.","Check parameters are invalid.":"입력한 검토 조건이 올바르지 않습니다.","Verified evidence for the selected Singapore market is unavailable.":"선택한 싱가포르 시장의 검증된 자료를 이용할 수 없습니다.","Complete every required native-market field.":"해당 시장의 필수 항목을 모두 입력하세요.","The selected completed-month window is outside verified evidence.":"선택한 완료 월의 기간이 검증된 자료 범위를 벗어납니다.","Both offers need supported native-market evidence before comparison.":"두 제안을 비교하려면 각각 해당 시장의 검증된 자료가 필요합니다.","Selected project and filters":"선택한 단지 및 필터","Selected project":"선택한 단지","Selected district":"선택한 지구","Selected market segment":"선택한 시장 권역","Selected town and filters":"선택한 타운 및 필터","Selected block and filters":"선택한 블록 및 필터","Selected block":"선택한 블록","Selected town":"선택한 타운","Singapore HDB":"싱가포르 HDB","Singapore private residential":"싱가포르 민간주택","Apartment":"아파트","Condominium":"콘도미니엄","Executive condominium":"이그제큐티브 콘도미니엄","Terrace house":"테라스 주택","Semi-detached house":"반단독 주택","Detached house":"단독주택","Strata area":"구분소유 면적","Land area":"토지 면적","Freehold":"영구 소유권","Unavailable":"이용 불가","Current product depth":"현재 제공 범위","Available evidence":"이용 가능한 자료","URA private residential sale transactions":"URA 민간주택 매매 거래","Native market segments":"현지 시장 권역","CCR, RCR and OCR remain separate.":"CCR, RCR 및 OCR을 구분합니다.","Supported decisions":"지원하는 의사결정","Explore and comparison tools stay inside the verified Singapore evidence boundary.":"둘러보기와 비교 도구는 검증된 싱가포르 자료 범위에서 제공합니다.","Explore Singapore":"싱가포르 둘러보기","Browse released segments and projects.":"공개된 권역과 단지를 확인하세요.","Check an offer":"제안 가격 검토","Compare against compatible released evidence.":"비교 가능한 공개 자료와 대조하세요.","Known limitations":"알려진 한계","These limits remain visible until the exact evidence and operating gates pass.":"자료 검증 및 운영 기준을 충족할 때까지 해당 한계를 표시합니다.","Listings and investment service":"매물 및 투자 서비스","Active listings, inquiries and personalized investment recommendations are not offered yet.":"현재 매물, 문의 및 개인 맞춤 투자 추천은 아직 제공하지 않습니다.","Open Singapore Explore":"싱가포르 둘러보기 열기","Read source, rights and publication rules.":"출처, 이용 권한 및 공개 기준을 확인하세요.","Singapore market overview":"싱가포르 시장 개요","Singapore market":"싱가포르 시장","Singapore Market Overview":"싱가포르 시장 개요","Market intelligence":"시장 정보","Transactions":"거래 수","Projects":"단지 수","Released URA evidence":"공개된 URA 자료","Currency":"통화","Native market currency":"해당 시장의 통화","Publication":"공개 상태","Verified":"검증됨","Minimum-sample rules enforced":"최소 표본 기준 적용","limited":"제한적 제공","available":"이용 가능","planned":"준비 중","Singapore Check | signedprice":"싱가포르 매물 가격 비교 | signedprice","Position a private sale, HDB resale, or HDB rent offer against verified recent Singapore evidence.":"민간주택 매매, HDB 재판매 또는 HDB 월세 제안을 최근 검증된 싱가포르 자료와 비교하세요.","Singapore private residential project rankings | signedprice":"싱가포르 민간주택 단지 순위 | signedprice","Compare published URA project sale medians, unit prices and reported transaction volumes.":"공개된 URA 단지별 매매 중위가격, 단위면적당 가격 및 신고 거래량을 비교하세요.","Singapore HDB town evidence | signedprice":"싱가포르 HDB 타운 자료 | signedprice","Separate HDB resale, rental, and property evidence by town and block.":"타운과 블록별 HDB 재판매, 임대 및 주택 정보를 구분하여 확인하세요.","Singapore HDB block evidence | signedprice":"싱가포르 HDB 블록 자료 | signedprice","Official HDB resale, rental, and property facts for one observed block.":"해당 블록의 공식 HDB 재판매, 임대 및 주택 정보입니다.","Singapore evidence corrections | signedprice":"싱가포르 자료 정정 내역 | signedprice",
  "Breadcrumb": "현재 위치",
  "Explore": "실거래가 탐색",
  "Singapore · HDB block": "싱가포르 · HDB 블록",
  "· official transaction and property records": "· 공식 거래 및 주택 기록",
  "Resale median": "재판매 중위가격",
  "records": "건",
  "01 / Building photo": "01 / 건물 사진",
  "02 / Separate distributions": "02 / 거래 유형별 분포",
  "Reported HDB evidence.": "신고된 HDB 거래 자료",
  "Monthly rent median": "월세 중위가격",
  "Publication minimum": "공개 최소 표본",
  "per transaction type": "거래 유형별",
  "03 / Property facts": "03 / 주택 정보",
  "HDB property information.": "HDB 주택 정보",
  "Matched property facts are unavailable for this observed block.": "이 블록에 일치하는 주택 정보를 확인할 수 없습니다.",
  "Year completed": "준공 연도",
  "Maximum floor": "최고 층수",
  "Dwelling units": "주택 수",
  "03 / HDB evidence": "03 / HDB 자료",
  "Verified HDB evidence is unavailable.": "검증된 HDB 자료를 이용할 수 없습니다.",
  "03 / HDB public housing": "03 / HDB 공공주택",
  "Resale, rent, and block facts—kept separate.": "재판매·임대 거래와 블록 정보를 구분하여 확인하세요.",
  "Official data.gov.sg records. Each median uses only its own transaction type and is withheld below": "data.gov.sg 공식 기록입니다. 중위가격은 거래 유형별로 계산하며, 다음 최소 표본 미만이면 공개하지 않습니다:",
  "observations.": "건",
  "Resale records": "재판매 거래 수",
  "Rental records": "임대 거래 수",
  "Property blocks": "주택 블록 수",
  "HDB resale median": "HDB 재판매 중위가격",
  "HDB monthly rent median": "HDB 월세 중위가격",
  "HDB resale and rental evidence by town": "타운별 HDB 재판매 및 임대 자료",
  "Town": "타운",
  "Resale n": "재판매 표본 수",
  "Rental n": "임대 표본 수",
  "HDB resale prices are indicative historical transactions, not a valuation.": "HDB 재판매 가격은 과거 거래를 참고하기 위한 자료이며 감정평가액이 아닙니다.",
  "Rental data is owner-declared when the flat is rented out and is not independently verified by HDB.": "임대 자료는 소유자가 임대 시 신고한 정보이며 HDB가 별도로 검증하지 않습니다.",
  "Property facts are reported through": "주택 정보 출처:",
  "; map and nearby Street View use Google separately.": ". 지도와 인근 스트리트 뷰는 Google에서 별도로 제공합니다.",
  "Official HDB source datasets": "HDB 공식 원본 데이터",
  "HDB resale source": "HDB 재판매 자료 출처",
  "HDB rental source": "HDB 임대 자료 출처",
  "HDB property source": "HDB 주택 정보 출처",
  "Singapore · HDB town": "싱가포르 · HDB 타운",
  "Observed blocks": "확인된 블록",
  "HDB evidence": "HDB 자료",
  "01 / Observed blocks": "01 / 확인된 블록",
  "blocks with HDB evidence.": "개 블록의 HDB 자료",
  "Block": "블록",
  "Scope": "범위",
  "Separate evidence": "구분된 자료",
  "Resale and rental observations remain separate. Select a block for reported facts and nearby Google Street View.": "재판매와 임대 자료는 별도로 표시합니다. 블록을 선택하여 신고 정보와 인근 Google 스트리트 뷰를 확인하세요.",
  "Offer": "매물",
  "Individual transaction evidence for this price check is not available in the current release.": "현재 버전에서는 이 가격 검토에 필요한 개별 거래 자료를 이용할 수 없습니다.",
  "Explore published Singapore evidence": "공개된 싱가포르 자료 둘러보기",
  "Any": "전체",
  "Latest available": "최신 자료",
  "Offer position": "제안 가격의 위치",
  "th percentile": "백분위",
  "Comparable scope": "비교 대상 범위",
  "Sample": "표본 수",
  "Completed window": "완료된 대상 기간",
  "Source": "출처",
  "Insufficient recent evidence": "최근 자료가 부족합니다",
  "comparable records · minimum": "건의 비교 거래 · 최소 표본",
  "; the time window was not widened.": "; 자료 기간을 확대하지 않았습니다.",
  "Evidence unavailable": "자료 이용 불가",
  "Result": "결과",
  "Enter an offer to check its market position.": "제안 가격을 입력하여 시장 내 위치를 확인하세요.",
  "Results show median, P25–P75, percentile, sample, completed window, scope and source.": "결과에는 중위가격, P25–P75, 백분위, 표본 수, 완료된 기간, 비교 범위와 출처가 표시됩니다.",
  "Check the entered fields.": "입력한 항목을 확인하세요.",
  "A/B result": "A/B 비교 결과",
  "Trade-off": "비교 시 고려할 점",
  "Each offer remains in its native market. No winner or conversion is inferred.": "각 제안은 해당 시장 안에서 비교합니다. 우열을 판단하거나 통화를 환산하지 않습니다.",
  "Offer A": "매물 A",
  "Offer B": "매물 B",
  "Singapore Check": "싱가포르 가격 비교",
  "Position an offer against its own market.": "이 매물, 최근 실거래가와 얼마나 다를까요?",
  "Recent completed months only": "최근 완료된 월의 자료만 사용",
  "Minimum 5 comparable transactions": "최소 5건의 비교 가능한 거래",
  "Check mode": "비교 방식",
  "One offer": "매물 1개",
  "Compare A/B": "A/B 비교",
  "Check result": "가격 비교 결과",
  "Singapore · Release gate": "싱가포르 · 공개 상태",
  "Private-home transaction evidence is not available in this view yet. Use the market overview for the available sources and coverage.": "이 화면에서는 아직 민간주택 거래 자료를 이용할 수 없습니다. 시장 개요에서 이용 가능한 출처와 범위를 확인하세요.",
  "Review Global Trust": "자료 신뢰성 확인",
  "Review corrections": "정정 내역 확인",
  "Singapore next steps": "싱가포르 다음 단계",
  "Singapore market layers": "싱가포르 시장 자료 유형",
  "Search Singapore projects": "싱가포르 단지 검색",
  "Project, street or district number": "단지명, 도로명 또는 지구 번호",
  "District": "지구",
  "All districts": "모든 지구",
  "projects": "개 단지",
  "Sort": "정렬",
  "Most transactions": "거래 많은 순",
  "Project name": "단지명",
  "Clear filters": "필터 초기화",
  "Singapore": "싱가포르",
  "Private residential projects": "민간주택 단지",
  "URA private sales · New sale, Subsale and Resale": "URA 민간주택 매매 · 신규 분양, 준공 전 전매 및 재판매",
  "Singapore market regions": "싱가포르 시장 권역",
  "All": "전체",
  "transactions ·": "건의 거래 ·",
  "Open": "보기:",
  "evidence": "자료",
  "At least 5 transactions are required": "최소 5건의 거래가 필요합니다",
  "matching projects": "개 검색 결과",
  "No projects match these filters. Try a different name or district.": "조건에 맞는 단지가 없습니다. 다른 이름이나 지구를 검색해 보세요.",
  "· District": "· 지구",
  "Details": "상세 보기",
  "Below 5 sales": "거래 5건 미만",
  "Project result pages": "단지 검색 결과 페이지",
  "Previous": "이전",
  "Page": "페이지",
  "of": "/",
  "Next": "다음",
  "matching projects across all result pages ·": "개 단지(전체 검색 결과) ·",
  "with source coordinates ·": "개 원본 좌표 확인 ·",
  "area-only ·": "개 지역 위치만 확인 ·",
  "without a map reference.": "개 지도 위치 미확인",
  "Each marker is a project with source coordinates. Select a marker to see its name and transactions. Projects without exact coordinates remain in the list. Turn on area references to see their approximate district.": "마커는 원본 좌표가 있는 단지입니다. 마커를 선택하면 이름과 거래를 확인할 수 있습니다. 정확한 좌표가 없는 단지도 목록에 표시됩니다. 지구별 대략적 위치를 켜면 해당 단지의 지구를 확인할 수 있습니다.",
  "Show approximate district groups": "지구별 대략적 위치 표시",
  "matching projects across all result pages · choose a": "개 단지(전체 검색 결과) · 선택:",
  "to open its full project map.": "— 해당 지역의 전체 단지 지도를 확인하세요.",
  "These district totals remain in the results; no reliable map reference is available yet.": "해당 지구의 집계는 결과에 포함되지만 아직 신뢰할 수 있는 지도 위치가 없습니다.",
  "projects remain selectable while their area reference is unavailable.": "개 단지는 지역 위치가 없어도 선택할 수 있습니다.",
  "Close project preview": "단지 미리보기 닫기",
  "Close": "닫기",
  "Open project evidence": "단지 자료 보기",
  "All published project prices": "공개된 모든 단지 가격",
  "Browse every published project by market region, including projects beyond the current result page.": "현재 결과 페이지에 없는 단지까지 포함하여 시장 권역별 공개 단지를 확인하세요.",
  "property prices": "주택 가격",
  "Condo buying guide: budgets, costs and ownership checks": "콘도 매수 가이드: 예산·비용·소유권 확인",
  "Official location context": "공식 위치 정보",
  "Nearby MRT/LRT and schools": "인근 MRT/LRT 및 학교",
  "Straight-line distance from the mapped property location. Walking routes can differ.": "지도상 주택 위치에서의 직선거리입니다. 실제 도보 경로와 다를 수 있습니다.",
  "Nearest rail": "가장 가까운 철도역",
  "Land Transport Authority": "육상교통청(LTA)",
  "Nearest MOE school": "가장 가까운 교육부 등록 학교",
  "Ministry of Education": "교육부(MOE)",
  "No project value is substituted.": "단지 가격을 대체하여 표시하지 않습니다.",
  "Singapore ·": "싱가포르 ·",
  ": distribution not published.": ": 가격 분포 미공개",
  "reported transactions. At least": "건의 신고 거래. 최소 표본:",
  "are required.": "건 필요",
  "Check this project price": "매물 가격 비교",
  "Median price": "중위가격",
  "01 / Project distribution": "01 / 단지 가격 분포",
  "Price and unit-price evidence.": "가격 및 단위면적당 가격 자료",
  "Middle half": "중앙 50% 구간",
  "Median": "중앙값",
  "Compare prices by home size": "주택 면적별 가격 비교",
  "Same project and reporting period. Property type, sale type, area basis and tenure stay separate. A cohort needs at least five transactions to publish its median.": "동일 단지와 보고 기간을 기준으로 주택 유형, 매매 유형, 면적 기준 및 소유권 형태를 구분합니다. 비교군의 거래가 최소 5건 이상이어야 중위가격을 공개합니다.",
  "Open calculator": "계산기 열기",
  "Project profile": "단지 정보",
  "Street": "도로명",
  "Tenure in reported records": "신고 기록의 소유권 형태",
  "Property types": "주택 유형",
  "View this project on the map": "지도에서 이 단지 보기",
  "02 / Recent reported transactions": "02 / 최근 신고 거래",
  "Reported sales, unit sizes and floors.": "신고 매매가격·면적·층수",
  "Month": "거래 월",
  "Price": "가격",
  "Area": "면적",
  "Sale": "매매 유형",
  "Property": "주택 유형",
  "Area basis": "면적 기준",
  "Tenure": "소유권 형태",
  "Floor": "층수",
  "Singapore project rankings": "싱가포르 단지 순위",
  "Compare reported project evidence.": "단지별 신고 자료를 비교하세요.",
  "URA private residential sales ·": "URA 민간주택 매매 ·",
  "Published projects": "공개 단지",
  "Default metric": "기본 지표",
  "Sale median": "매매 중위가격",
  "Singapore ranking metric": "싱가포르 순위 지표",
  "Singapore ranking pages": "싱가포르 순위 페이지",
  "Ranking by": "정렬 기준",
  "Only projects meeting the publication minimum are included. This is not a quality or investment score.": "최소 공개 표본을 충족한 단지만 포함합니다. 주택 품질이나 투자 점수가 아닙니다.",
  "No published project distribution is available.": "공개된 단지 가격 분포가 없습니다.",
  "Loading verified Singapore evidence": "검증된 싱가포르 자료를 불러오는 중",
  "Return to Singapore Explore": "싱가포르 둘러보기로 돌아가기",
  "No segment value is substituted.": "권역 가격을 대체하여 표시하지 않습니다.",
  "Return to Explore": "둘러보기로 돌아가기",
  "Distribution not published.": "가격 분포 미공개",
  "No monetary value is substituted for sparse evidence.": "자료가 부족한 경우 다른 가격으로 대체하지 않습니다.",
  "Singapore · Market segment": "싱가포르 · 시장 권역",
  "01 / Published distribution": "01 / 공개 가격 분포",
  "Raw transaction evidence.": "원본 거래 자료",
  "Median unit price": "단위면적당 중위가격",
  "02 / Projects": "02 / 단지",
  "Projects in": "권역별 단지:",
  "reported transactions": "건의 신고 거래",
  "Singapore sale scope": "싱가포르 매매 범위",
  "New sale": "신규 분양",
  "Subsale": "준공 전 전매",
  "Resale": "재판매",
  "Private residential sales": "민간주택 매매",
  "Source boundary": "자료 범위",
  "What this evidence can support.": "이 자료로 확인할 수 있는 내용",
  "Private residential sale transactions; native area basis retained; publication minimum enforced.": "민간주택 매매 거래이며 원본 면적 기준과 최소 공개 표본을 유지합니다.",
  "Review Singapore corrections": "싱가포르 정정 내역 확인",
  "Sources & limits": "출처 및 한계",
  "Not published": "미공개",
  "Market regions": "시장 권역",
  "Postal districts": "우편 지구",
  "Project locations": "단지 위치",
  "market region": "시장 권역",
  "postal district": "우편 지구",
  "No matches": "검색 결과 없음",
  "sale": "건 매매",
  "sales": "건 매매",
  "Approximate district location": "지구 기준 대략적 위치",
  "Project location unavailable": "단지 위치 확인 불가",
  "Preparing the selected market region.": "선택한 시장 권역을 준비하고 있습니다.",
  "Preparing the selected project and transactions.": "선택한 단지와 거래 자료를 준비하고 있습니다.",
  "URA private sale": "URA 민간주택 매매",
  "URA private sales": "URA 민간주택 매매",
  "HDB resale": "HDB 재판매",
  "HDB rent": "HDB 임대",
  "Evidence ready": "자료 이용 가능",
  "Compare offers": "매물 비교",
  "Check offer": "제안 가격 검토",
  "Monthly rent (SGD)": "월세(SGD)",
  "Price (SGD)": "가격(SGD)",
  "Market segment": "시장 권역",
  "Project": "단지",
  "Property type": "주택 유형",
  "Area minimum (㎡)": "최소 면적(㎡)",
  "Area maximum (㎡)": "최대 면적(㎡)",
  "Floor range": "층수 범위",
  "Sale type": "매매 유형",
  "Block / street": "블록 / 도로명",
  "Flat type": "주택 유형",
  "Storey range": "층수 범위",
  "Completed month": "완료된 거래 월",
  "Price / sq ft": "제곱피트당 가격",
  "Filing volume": "신고 거래 수"
};

/** Translate presentation strings only; numeric values, record IDs and source data stay intact. */
export function sgText<T>(locale: MarketLocale, value: T): T {
  if (locale === 'en' || typeof value !== 'string') return value;
  if (locale === 'zh-CN') {
    const key = value.trim();
    if (chineseSingaporeCopy[key] !== undefined) return value.replace(key, chineseSingaporeCopy[key]) as T;
    const translated = value
      .replace(/Market intelligence in (.+)\./g, '$1 市场信息')
      .replace(/Official private residential sale evidence, separated by native market segment\. /g, '按本地市场分区统计的官方私人住宅成交数据。')
      .replace(/Private residential sales · /g, '私人住宅交易 · ')
      .replace(/([\d,]+) private residential sale transactions across ([\d,]+) projects\./g, '$2 个项目的 $1 笔私人住宅交易。')
      .replace(/([\d,]+) private residential sale transactions/g, '$1 笔私人住宅交易')
      .replace(/([\d,]+) reported sale transactions/g, '$1 笔已申报交易')
      .replace(/([\d,]+) reported sales/g, '$1 笔已申报交易')
      .replace(/([\d,]+) projects/g, '$1 个项目')
      .replace(/District (\d+)/g, '第 $1 邮区')
      .replace(/([\d,]+) filings/g, '$1 笔申报')
      .replace(/approximate area, not project locations/g, '大致区域，并非项目位置')
      .replace(/Area only/g, '仅区域位置')
      .replace(/([\d,]+–[\d,]+) shown/g, '显示 $1')
      .replace(/Open (.+) evidence/g, '查看 $1 数据')
      .replace(/Offer ([AB]) market/g, '报价 $1 市场')
      .replace(/Most-observed towns · full reported period (.+)/g, '交易较多的市镇 · 完整申报期间 $1')
      .replace(/The exact selection was below five records; (\w+) evidence is shown without widening the time window\./g, (_, level: string) => `精确条件下少于 5 笔记录；保持时间范围不变，显示${({project:'项目',district:'邮区',segment:'区域',block:'楼栋',town:'市镇',national:'全国'} as Record<string,string>)[level] ?? level}范围的数据。`)
      .replace(/(\d+)(?: yrs| years| Yrs| Years)(?: lease)?(?: (?:commencing )?from (\d{4}))?/g, (_, years: string, from?: string) => `${years} 年产权${from ? `（${from} 年起）` : ''}`);
    if (translated !== value) return translated as T;
    if (value.includes(' · ')) return value.split(' · ').map(part => sgText(locale, part)).join(' · ') as T;
    return marketText(locale, value);
  }
  const key = value.trim();
  if (copy[key]) return value.replace(key, copy[key]) as T;
  const monthNames: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Sept: 9, Oct: 10, Nov: 11, Dec: 12 };
  const translated = value
    .replace(/Market intelligence in (.+)\./g, '$1 기준 시장 정보')
    .replace(/Official private residential sale evidence, separated by native market segment\. /g, '현지 시장 권역별 공식 민간주택 매매 자료. ')
    .replace(/Private residential sales · /g, '민간주택 매매 · ')
    .replace(/([\d,]+) private residential sale transactions across ([\d,]+) projects\./g, '$2개 단지의 민간주택 매매 $1건.')
    .replace(/([\d,]+) private residential sale transactions/g, '민간주택 매매 $1건')
    .replace(/([\d,]+) reported sale transactions/g, '신고 매매 $1건')
    .replace(/([\d,]+) reported sales/g, '신고 매매 $1건')
    .replace(/([\d,]+) filings/g, '신고 $1건')
    .replace(/([\d,]+) projects/g, '$1개 단지')
    .replace(/approximate area, not project locations/g, '대략적 지역이며 단지 위치가 아닙니다')
    .replace(/Area only/g, '지역 위치만 확인')
    .replace(/([\d,]+–[\d,]+) shown/g, '$1 표시')
    .replace(/Open (.+) evidence/g, '$1 자료 보기')
    .replace(/Offer ([AB]) market/g, '매물 $1 거래 유형')
    .replace(/District (\d+)/g, '지구 $1')
    .replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec) (\d{4})/g, (_, month: string, year: string) => `${year}년 ${monthNames[month]}월`)
    .replace(/Most-observed towns · full reported period (.+)/g, '거래가 많은 타운 · 전체 신고 기간 $1')
    .replace(/The exact selection was below five records; (\w+) evidence is shown without widening the time window\./g, (_, level: string) => `정확히 일치하는 거래가 5건 미만이므로 기간을 확대하지 않고 ${{project:'단지',district:'지구',segment:'권역',block:'블록',town:'타운',national:'전국'}[level] ?? level} 범위의 자료를 표시합니다.`)
    .replace(/(\d+)(?: yrs| years| Yrs| Years)(?: lease)?(?: (?:commencing )?from (\d{4}))?/g, (_, years: string, from?: string) => `${years}년 임차권${from ? ` (${from}년 시작)` : ''}`);
  if (translated !== value) return translated as T;
  if (value.includes(' · ')) return value.split(' · ').map(part => sgText(locale, part)).join(' · ') as T;
  return marketText(locale, value) as T;
}

/** Keep each localized route canonical to itself, with an explicit language pair. */
export function singaporeMetadata(metadata: import('next').Metadata): import('next').Metadata {
  const canonical = metadata.alternates?.canonical?.toString();
  const ko = canonical?.replace(/(?<!\/ko)\/sg\/singapore\//, '/ko/sg/singapore/');
  const en = ko?.replace('/ko/sg/', '/sg/');
  const zh = en?.replace('/sg/', '/zh-cn/sg/');
  const image = 'https://www.signedprice.com/og.png';
  const title = typeof metadata.title === 'string' ? sgText('ko', metadata.title) : metadata.title;
  const description = sgText('ko', metadata.description);
  const fallbackTitle = typeof title === 'string' ? title : undefined;
  const fallbackDescription = typeof description === 'string' ? description : undefined;
  const openGraphTitle = typeof metadata.openGraph?.title === 'string'
    ? sgText('ko', metadata.openGraph.title)
    : (metadata.openGraph?.title ?? fallbackTitle);
  const openGraphDescription = sgText(
    'ko',
    metadata.openGraph?.description ?? fallbackDescription,
  );
  const twitterTitle = typeof metadata.twitter?.title === 'string'
    ? sgText('ko', metadata.twitter.title)
    : (metadata.twitter?.title ?? fallbackTitle);
  const twitterDescription = sgText(
    'ko',
    metadata.twitter?.description ?? fallbackDescription,
  );
  return { ...metadata, title, description,
    alternates: ko ? { ...metadata.alternates, canonical: ko, languages: { en, ko, 'zh-Hans': zh, 'x-default': en } } : metadata.alternates,
    openGraph: { ...metadata.openGraph, title: openGraphTitle, description: openGraphDescription, url: ko, locale: 'ko_KR', alternateLocale: ['en_US', 'zh_CN'], images: [image] },
    twitter: { ...metadata.twitter, card: 'summary_large_image', title: twitterTitle, description: twitterDescription, images: [image] },
  };
}
