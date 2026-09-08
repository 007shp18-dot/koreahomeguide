export type StoryCity = 'seoul' | 'singapore' | 'dubai' | 'tokyo';
export type StoryLocale = 'en' | 'ko';
export type StoryText = Readonly<{ en: string; ko: string }>;
export type StoryLink = Readonly<{ href: string; label: StoryText }>;
export type StorySection = Readonly<{ id: string; title: StoryText; paragraphs: Readonly<{ en: readonly string[]; ko: readonly string[] }>; links: readonly StoryLink[] }>;
export type CityStory = Readonly<{ city: StoryCity; name: StoryText; title: StoryText; deck: StoryText; sections: readonly [StorySection, StorySection, StorySection, StorySection, StorySection, StorySection]; sources: readonly { title: string; href: string }[] }>;
export const CITY_STORIES: readonly [CityStory, ...CityStory[]] = [
  {
    "city": "seoul",
    "name": {
      "ko": "서울",
      "en": "Seoul"
    },
    "title": {
      "ko": "성수가 좋다면, 왕십리와 마포의 집도 함께 볼 이유",
      "en": "Love Seongsu? Compare three very different ways to live in Seoul"
    },
    "deck": {
      "ko": "성수의 작업장 골목과 서울숲, 왕십리의 대단지와 환승역, 마포의 서로 다른 생활권. 좋아하는 장소를 실제로 살 집의 조건으로 바꾸는 서울 주거 지도.",
      "en": "Seongsu's workshop streets, Wangsimni's apartment clusters and Mapo's many centres offer three distinct versions of Seoul life—and three different housing searches."
    },
    "sections": [
      {
        "id": "discover",
        "title": {
          "ko": "공장 골목에서 서울숲까지, 서로 다른 성수",
          "en": "Seongsu is several neighbourhoods in one"
        },
        "paragraphs": {
          "ko": [
            "연무장길을 걷다 보면 오래된 공장과 수제화 작업장 사이로 카페와 쇼룸이 이어진다. 조금만 방향을 바꾸면 낮은 다세대주택이 모인 골목이 나오고, 서울숲과 한강 쪽으로 갈수록 대형 아파트와 새 주거단지가 눈에 들어온다. ‘성수에 산다’는 말만으로는 집 앞의 모습까지 설명하기 어려운 이유다.",
            "성수역과 뚝섬역은 모두 2호선에 있지만 같은 생활권은 아니다. 연무장길의 상업·업무 공간을 자주 이용할지, 서울숲 산책로와 수인분당선 접근이 중요한지, 한강변 아파트의 단지형 생활을 원하는지에 따라 후보가 갈린다. 주말에 붐비는 거리에서 한 블록 벗어나 평일 아침의 보행로, 장보기, 차량 진입과 밤의 소음을 살펴보면 관광지의 인상 뒤에 있는 주거지가 보인다."
          ],
          "en": [
            "Walk along Yeonmujang-gil and old factories and handmade-shoe workshops now sit among cafés, studios and fashion showrooms. Turn into the residential streets and the scale drops to villas and small apartment buildings; move towards Seoul Forest and the river and major apartment developments become far more prominent. A Seongsu address can therefore mean a converted industrial street, a low-rise block or a managed high-rise estate.",
            "Seongsu and Ttukseom stations are both on Line 2, but they do not produce the same daily pattern. One buyer may want the commercial energy around Yeonmujang-gil; another may prioritise Seoul Forest, access to the Suin–Bundang Line or the self-contained feel of a riverside apartment complex. Visit beyond the weekend rush: the morning pavement, grocery options, vehicle access and late-evening noise reveal the residential neighbourhood behind the destination."
          ]
        },
        "links": [
          {
            "href": "/kr/seoul/",
            "label": {
              "ko": "서울 주택 시장 살펴보기",
              "en": "Get to know the Seoul market"
            }
          }
        ]
      },
      {
        "id": "why-buy",
        "title": {
          "ko": "성수의 매력에 얼마를 지불하는지 분해해 보기",
          "en": "Decide which part of the Seongsu premium matters to you"
        },
        "paragraphs": {
          "ko": [
            "성수에서 집을 산다는 선택에는 서로 다른 값이 섞여 있다. 2호선과 강남권 접근, 서울숲과 한강, 눈에 띄는 상권, 특정 단지의 관리와 전망은 같은 항목이 아니다. 카페와 브랜드가 바뀌어도 남아 있을 조건과 지금의 유행에 가까운 조건을 나누면, 원하는 주소가 아니라 원하는 생활을 설명할 수 있다.",
            "오래 거주할 집이라면 방 수와 수납, 학교·돌봄, 주차처럼 매일 반복되는 조건이 동네의 화제성보다 오래 영향을 미친다. 반대로 직장 접근과 도심 활동이 핵심이라면 면적을 줄여 입지를 택하는 편이 맞을 수 있다. 왕십리의 비교적 정돈된 대단지나 마포의 업무지 접근성이 같은 예산에서 무엇을 더 주는지 보면, 성수에 지불하려는 몫이 선명해진다."
          ],
          "en": [
            "A Seongsu purchase can bundle several kinds of value: Line 2 access, Seoul Forest and the Han River, a highly visible retail scene, and the management or views of a particular apartment estate. They are not interchangeable. Separate the qualities likely to survive a change in tenants and trends from the appeal created by today's restaurants and brands; that exposes what you are actually paying to keep.",
            "For a long-term home, bedrooms, storage, schools or care arrangements, parking and building management often matter longer than neighbourhood fame. If access to work and central-city activity is the priority, less space in Seongsu may still be a coherent choice. Compare what the same capital buys in Wangsimni's more uniform apartment clusters and on the Gongdeok–Ahyeon side of Mapo before deciding how much of the budget belongs to the Seongsu location itself."
          ]
        },
        "links": [
          {
            "href": "/tools/property-scenario/",
            "label": {
              "ko": "내 조건으로 보유비용 계산하기",
              "en": "Build your ownership-cost scenario"
            }
          }
        ]
      },
      {
        "id": "can-i-buy",
        "title": {
          "ko": "외국인 매수 가능 여부와 대출 가능액은 다른 질문입니다",
          "en": "The right to buy and the ability to finance are separate questions"
        },
        "paragraphs": {
          "ko": [
            "외국인이라는 이유만으로 서울의 일반 아파트 매수가 일괄 금지되는 것은 아니지만, 부동산 거래 신고와 외국인 취득 관련 신고, 자금 이동과 세무 확인은 거래 당사자의 거주 상태와 취득 방식에 따라 달라질 수 있다. 토지 이용 규제가 있는 구역이나 특수한 소유 구조라면 추가 확인도 필요하다. 계약서에 서명하기 전, 대상 부동산과 본인의 신분을 기준으로 중개사·법무사 등 거래 전문가에게 적용 절차를 확인해야 한다.",
            "금융은 별도의 심사다. 국내 소득, 체류 자격, 신용 기록, 담보가치와 은행의 상품 기준에 따라 가능한 대출이 크게 달라질 수 있으므로 예상 한도를 매매예산으로 먼저 확정하기 어렵다. 계약금·잔금과 취득비용, 환전·송금 비용, 수리비, 입주 뒤 남길 현금을 나누고 은행이 확인한 조달액만 반영하면 성수에서 면적을 줄일지, 왕십리나 마포로 범위를 넓힐지 판단할 수 있다."
          ],
          "en": [
            "Foreign status does not create a blanket ban on buying an ordinary Seoul apartment, but transaction reporting, foreign-acquisition reporting, movement of funds and tax treatment can depend on the buyer, the method of acquisition and the property. A regulated land area or an unusual ownership structure can add another check. Before signing, have the professionals handling the transaction confirm the current filings for both your status and the exact title.",
            "Financing is a separate approval. Korean income, residence status, domestic credit history, collateral value and each lender's policy can all affect the amount available. Build the search from cash that can be documented and transferred, then reserve money for acquisition costs, repairs and life after completion. Only a lender-confirmed figure should decide whether the answer is a smaller Seongsu home or a wider search towards Wangsimni and Mapo."
          ]
        },
        "links": [
          {
            "href": "/guides/buy-property-in-korea-as-foreigner/",
            "label": {
              "ko": "외국인 매수 절차 확인하기",
              "en": "Check the foreign-buyer sequence"
            }
          },
          {
            "href": "/news/seoul-59sqm-under-700-million-2026/",
            "label": {
              "ko": "서울 59㎡·7억원 이하 실거래 읽기",
              "en": "See recent Seoul sales below KRW 700m"
            }
          }
        ]
      },
      {
        "id": "where",
        "title": {
          "ko": "성수·왕십리·마포, 같은 예산으로 달라지는 생활",
          "en": "Seongsu, Wangsimni and Mapo trade space for access in different ways"
        },
        "paragraphs": {
          "ko": [
            "성수는 공장·상업·저층주거·한강변 아파트가 가까운 거리에서 바뀌는 동네다. 건물 종류와 역까지의 길이 가격 못지않게 중요하다. 왕십리는 2·5호선과 경의중앙선·수인분당선이 만나는 환승축을 중심으로 상업시설과 대단지 아파트가 모여 있어, 복잡한 골목의 개성보다 단지 관리와 여러 방향의 철도 접근을 중시하는 사람에게 비교가 쉽다. 다만 역의 어느 출구인지, 행당·상왕십리 쪽 어느 단지인지에 따라 체감이 달라진다.",
            "마포는 한 동네가 아니라 넓은 자치구다. 공덕·마포역 주변은 업무지와 연결되는 아파트·오피스 복합 환경이 강하고, 아현 쪽에는 재개발된 대단지가 많다. 서쪽의 연남·망원까지 ‘마포’ 한 가격으로 묶으면 저층주택, 상권과 공원의 성격이 섞인다. 세 지역을 비교할 때는 전용면적과 준공연도, 단지 규모, 계약월을 맞춘 뒤 실제 출발역과 목적지를 적어야 한다. 성수의 작은 신축, 왕십리의 구축 대단지, 공덕·아현의 역세권 아파트는 총액이 비슷해도 관리 방식과 하루의 동선이 전혀 다르다."
          ],
          "en": [
            "Seongsu changes quickly from industrial and retail streets to low-rise housing and then to large riverside estates, so building type and the walk to the station matter as much as the district name. Wangsimni is organised around a major interchange serving Lines 2 and 5, the Gyeongui–Jungang Line and the Suin–Bundang Line. Its shopping facilities and apartment clusters can suit buyers who value managed estates and multi-direction rail access over Seongsu's mixed street texture—although the experience still changes by exit and by the Haengdang or Sangwangsimni side.",
            "Mapo is a large district, not a single neighbourhood. Around Gongdeok and Mapo stations, apartment and office developments emphasise access to major employment areas; Ahyeon has extensive redeveloped apartment estates. Farther west, Yeonnam and Mangwon introduce a different low-rise stock, park relationship and street economy, so a single 'Mapo price' is misleading. Match exclusive area, completion period, estate scale and contract month. A compact newer Seongsu unit, an older Wangsimni estate and a station-area apartment in Gongdeok or Ahyeon may share a total price while offering very different management, space and movement."
          ]
        },
        "links": [
          {
            "href": "/kr/seoul/explore/",
            "label": {
              "ko": "Explore에서 지역과 실거래 비교하기",
              "en": "Compare areas and transactions in Explore"
            }
          }
        ]
      },
      {
        "id": "which-home",
        "title": {
          "ko": "같은 평수처럼 보여도 같은 집은 아닙니다",
          "en": "The same headline size can conceal a different home"
        },
        "paragraphs": {
          "ko": [
            "아파트는 전용면적을 기준으로 비교하되 공급면적, 방 배치, 발코니 확장 여부를 따로 확인한다. 같은 전용 59㎡라도 판상형과 타워형, 복도식과 계단식, 저층과 고층은 채광·통풍·사생활이 다르다. 성수의 소규모 신축은 새 설비와 위치가 장점일 수 있지만 주차와 관리 인력, 거래량이 제한적일 수 있고, 왕십리나 아현의 대단지는 공용시설과 관리 기록, 유사 거래를 찾기 쉬운 대신 연식과 수선 부담을 봐야 한다.",
            "방문 전에는 등기와 건축물대장, 토지 지분, 위반건축물 여부, 대출·임차 권리관계를 전문가와 확인할 항목으로 남긴다. 현장에서는 햇빛이 드는 시간, 창밖 거리와 철도 소음, 엘리베이터 수, 쓰레기 동선, 지하주차장과 누수 흔적을 본다. 재건축·재개발 기대가 가격에 들어간 집은 공식 정비 단계와 추가 부담 가능성을 확인해야 하며, 중개 설명만으로 미래 일정을 확정해서는 안 된다."
          ],
          "en": [
            "Compare apartments by exclusive-use area, then inspect supply area, room arrangement and any balcony conversion separately. Two 59-square-metre homes can differ sharply by slab or tower layout, corridor access, floor, light and ventilation. A small new Seongsu project may offer fresh systems and a coveted position but have limited parking, management capacity or transaction history. A large older estate in Wangsimni or Ahyeon may provide fuller records and more comparables while carrying age-related repair questions.",
            "Before a viewing, flag the title, building register, land share, unauthorised works and existing secured or tenancy interests for professional review. On site, check light at the relevant hour, road and rail noise, lift capacity, waste routes, basement parking and signs of water damage. If redevelopment expectations are embedded in the price, verify the official project stage and possible owner contributions; a broker's description is not a construction timetable."
          ]
        },
        "links": [
          {
            "href": "/kr/seoul/check/",
            "label": {
              "ko": "제안받은 가격 확인하기",
              "en": "Check an asking price"
            }
          }
        ]
      },
      {
        "id": "make-it-happen",
        "title": {
          "ko": "집을 정했다면, 돈이 필요한 날짜부터",
          "en": "Turn the final address into a dated cash plan"
        },
        "paragraphs": {
          "ko": [
            "매수 후보가 정해지면 계약금, 중도금이 있다면 그 지급일, 잔금, 대출 실행, 취득세와 중개·법무 비용을 날짜순으로 적는다. 해외 자금은 환전 시점과 송금 증빙, 국내 계좌 입금에 걸리는 시간을 반영한다. 계약 해제 조건과 대출 불발 시 책임은 계약서 문구에 따라 달라지므로 서명 전에 확인한다.",
            "이 단계의 핵심은 성수라는 이름이 아니라 특정 동·호수다. 최근 유사 면적 거래와 매도호가의 차이, 수리 범위, 입주 가능일, 권리관계가 자금표 안에서 맞아야 한다. 서울 매입 가이드에서 비용과 서류 순서를 확인한 뒤 중개사와 법무·세무 전문가에게 해당 거래의 일정과 의무를 확정하면, 동네 비교가 실행 가능한 계약 검토로 바뀐다."
          ],
          "en": [
            "Once one home survives the comparison, date every cash event: contract deposit, any interim payment, balance, loan drawdown, acquisition tax, brokerage and legal work. For overseas funds, allow for exchange, proof of source and transfer processing. Financing failure and cancellation do not have universal consequences; the contract wording determines the risk, so those clauses need review before signature.",
            "The decision is no longer 'Seongsu' but a particular unit. Comparable contracts, the seller's asking price, required works, vacant-possession date and title issues all have to fit the same cash schedule. Use the Seoul purchase guide for the cost categories and document sequence, then have the professionals on the transaction settle the obligations and dates that apply to this sale."
          ]
        },
        "links": [
          {
            "href": "/guides/buy-property-in-korea-as-foreigner/",
            "label": {
              "ko": "매수 절차와 준비할 서류",
              "en": "Purchase steps and documents"
            }
          }
        ]
      }
    ],
    "sources": [
      {
        "title": "Seoul Metropolitan Government · Seongsu urban regeneration and traditional industries",
        "href": "https://english.seoul.go.kr/wp-content/uploads/2018/03/regeneration_of_underutilized_city_centers2.pdf"
      },
      {
        "title": "Seoul Metropolitan Government · Seoul metropolitan rail map",
        "href": "https://english.seoul.go.kr/wp-content/uploads/2014/02/eng_metrolines.pdf"
      },
      {
        "title": "Seoul Metropolitan Government · Subway accessibility facilities by station",
        "href": "https://english.seoul.go.kr/service/movement/public-transportation/subway-accessibility-facilities/"
      },
      {
        "title": "Korea Ministry of Government Legislation · Acquisition of Real Estate (Housing, Land)",
        "href": "https://m.easylaw.go.kr/MOM/SubCsmOvRetrieve.laf?ccfNo=1&cciNo=1&cnpClsNo=1&csmSeq=2499&langCd=700101"
      },
      {
        "title": "Ministry of Land, Infrastructure and Transport · Apartment sale transaction detail API",
        "href": "https://www.data.go.kr/data/15126468/openapi.do"
      }
    ]
  },
  {
    "city": "singapore",
    "name": {
      "ko": "싱가포르",
      "en": "Singapore"
    },
    "title": {
      "ko": "티옹바루·퀸스타운·탐피니스, 어디에 살까",
      "en": "Three versions of Singapore life: Tiong Bahru, Queenstown and Tampines"
    },
    "deck": {
      "ko": "보존된 저층 플랫과 오래된 위성도시, 동부의 성숙한 계획도시. 주소보다 주택 유형과 매수 자격을 먼저 읽는 싱가포르 집 이야기.",
      "en": "Conserved low-rise flats, a layered first satellite town and a mature eastern regional centre reveal why housing type—and eligibility—matter more than a district label."
    },
    "sections": [
      {
        "id": "discover",
        "title": {
          "ko": "낮은 플랫과 시장 골목, 티옹바루의 생활",
          "en": "In Tiong Bahru, the age of the block shapes the life around it"
        },
        "paragraphs": {
          "ko": [
            "티옹바루의 인상은 낮고 곡선이 살아 있는 전쟁 전후 싱가포르개선신탁(SIT) 플랫에서 시작한다. 일부 전쟁 전 블록은 보존 대상으로 지정됐고, 림리악로드와 셍포로드 주변에는 1948~1954년에 지어진 4층 플랫도 남아 있다. 그 사이로 시장과 푸드센터, 작은 상점이 가까이 모여 있어 자동차보다 도보의 속도로 동네가 읽힌다.",
            "하지만 매물 검색에서 ‘Tiong Bahru’를 입력하면 같은 장면만 나오지 않는다. 역사적 플랫의 독특한 평면, 주변의 일반 HDB 고층동, 인접 지역의 민간 콘도는 소유 형태와 관리, 엘리베이터·주차, 거래 자료가 다르다. MRT역 이름만 보지 말고 역에서 실제 블록까지의 길, 시장을 지나는지 큰 도로를 건너는지, 집이 보존구역 안인지 밖인지부터 구분해야 한다."
          ],
          "en": [
            "Tiong Bahru's strongest visual identity comes from low-rise Singapore Improvement Trust flats with curved corners, horizontal lines and sheltered stairways. Twenty pre-war blocks were conserved, while four-storey post-war flats built from 1948 to 1954 remain around Lim Liak and Seng Poh roads. The market, food centre and small shopfronts sit within this compact fabric, making the neighbourhood legible on foot rather than only from a train map.",
            "A property search for 'Tiong Bahru' does not return one product. Historic flats have unusual plans and building constraints; nearby conventional HDB towers and private condominiums have different tenure, management, lifts, parking and transaction records. Look at the route from the actual block to the station, not just the station label. Crossing a major road, passing through the market precinct and sitting inside or outside the conservation area can materially change daily use."
          ]
        },
        "links": [
          {
            "href": "/sg/singapore/",
            "label": {
              "ko": "싱가포르 주택 시장 살펴보기",
              "en": "Explore Singapore's housing market"
            }
          }
        ]
      },
      {
        "id": "why-buy",
        "title": {
          "ko": "동네를 사는 선택과 주택 제도를 선택하는 일",
          "en": "You are choosing both a neighbourhood and a housing system"
        },
        "paragraphs": {
          "ko": [
            "싱가포르에서 HDB 플랫과 민간 콘도는 같은 가격표의 두 버전이 아니다. HDB는 공공주택 자격, 최소거주기간과 향후 처분 조건이 적용되는 생활 기반이고, 콘도는 공용시설과 사적 관리, 별도의 유지비를 가진 민간 소유 상품이다. 어느 쪽을 살 수 있는지뿐 아니라 어느 제도 안에서 몇 년을 보낼지에 따라 후보 목록이 달라진다.",
            "직접 거주한다면 티옹바루의 작은 역사적 평면과 도심 가장자리의 생활, 퀸스타운의 다양한 HDB 단지와 민간 프로젝트, 탐피니스의 넓은 타운 서비스를 같은 질문으로 비교할 수 없다. 임대 목적이라면 예상 임대료보다 먼저 소유·임대 제한, 관리비, 공실과 매도 시 조건을 확인해야 한다. 매수 이유가 달라지면 같은 침실 수의 가치도 달라진다."
          ],
          "en": [
            "An HDB flat and a private condominium are not two versions of the same product. HDB ownership sits inside a public-housing eligibility system with occupation and later-disposal conditions; a condominium is private strata ownership with its own facilities, management corporation and recurring charges. The first question is not simply which looks better, but which system you are eligible for and prepared to live within for the intended holding period.",
            "For an owner-occupier, a compact historic Tiong Bahru plan, Queenstown's range of HDB estates and private projects, and Tampines' broad town-level services answer different needs. For a rental purchase, the comparison shifts to permitted use, management charges, vacancy and exit conditions rather than an advertised rent alone. Clarifying the role of the home prevents a gym, balcony or famous postcode from standing in for the qualities the household will actually use."
          ]
        },
        "links": [
          {
            "href": "/tools/property-scenario/?market=sg-singapore&currency=SGD",
            "label": {
              "ko": "싱가포르 보유비용 계산하기",
              "en": "Compare the ownership costs"
            }
          }
        ]
      },
      {
        "id": "can-i-buy",
        "title": {
          "ko": "콘도를 살 수 있다는 말은 HDB도 살 수 있다는 뜻이 아닙니다",
          "en": "Condo access does not imply HDB eligibility"
        },
        "paragraphs": {
          "ko": [
            "HDB 플랫은 일반 민간시장처럼 누구에게나 열려 있지 않다. 시민권·영주권, 가족 구성, 연령, 기존 주택 보유와 신청 유형에 따라 자격이 달라지며, HDB Flat Eligibility(HFE) 확인이 검색의 출발점이다. 외국인 단독 매수자라면 HDB 재판매 호가가 예산에 맞아 보여도 곧바로 선택지로 볼 수 없다. 혼합 국적 가구나 영주권 가구도 해당 가족 제도의 현재 조건을 확인해야 한다.",
            "싱가포르 토지청 안내에 따르면 외국인은 승인 없이 콘도 유닛을 취득할 수 있지만, 단독주택 등 제한 주거용 부동산은 별도 승인이 필요하다. 여기에 매수자 인지세와 추가매수자 인지세가 더해질 수 있으며, 추가세는 국적·영주권·기존 보유 수·공동매수 구조와 감면 여부에 따라 달라진다. 세율을 기억에 의존하지 말고 IRAS의 현재 표와 HDB·SLA의 자격 안내를 매물별로 다시 확인해야 한다."
          ],
          "en": [
            "HDB flats are not an open private market. Eligibility depends on citizenship or permanent-resident status, household composition, age, existing property interests and the scheme used; the HDB Flat Eligibility process is the practical starting point. A foreign buyer acting alone cannot treat an affordable-looking resale-flat listing as an available substitute for a condominium. Mixed-status and permanent-resident households must check the current rules for their exact family structure rather than borrow another household's answer.",
            "The Singapore Land Authority states that a foreign person may buy a condominium unit without approval, while restricted residential property such as landed housing requires approval. That does not settle the cash requirement. Buyer's Stamp Duty applies, and Additional Buyer's Stamp Duty may depend on nationality or residence, the number of homes already owned, the acquisition structure and any remission. Use the live IRAS tables and official HDB and SLA guidance for the named buyers and property before an option is exercised."
          ]
        },
        "links": [
          {
            "href": "/news/policy/singapore-absd-policy-status/",
            "label": {
              "ko": "매수자 조건과 인지세 확인하기",
              "en": "Check buyer profile and stamp duties"
            }
          },
          {
            "href": "/guides/singapore-condo-buying-budget-guide/",
            "label": {
              "ko": "콘도 매수 예산과 절차 살펴보기",
              "en": "Read the Singapore condo buying guide"
            }
          }
        ]
      },
      {
        "id": "where",
        "title": {
          "ko": "중심지와의 거리보다 중요한 집의 차이",
          "en": "The three areas differ as much by housing stock as by location"
        },
        "paragraphs": {
          "ko": [
            "티옹바루는 보존된 저층 SIT 플랫과 시장 중심의 촘촘한 거리, 도심 가장자리라는 희소성이 핵심이다. 대신 매물 수와 평면, 엘리베이터·주차 같은 조건이 블록마다 크게 다를 수 있다. 퀸스타운은 싱가포르 최초의 위성도시로, 커먼웰스와 메이링의 오래된 HDB부터 도슨의 고층 재개발 주택, 알렉산드라 일대의 민간 콘도까지 여러 세대의 주거가 섞여 있다. ‘퀸스타운 평균’보다 어느 역과 어느 단지인지가 중요하다.",
            "탐피니스는 HDB 계획도시의 규모가 생활을 만든다. 타운센터와 MRT·버스환승장, 여러 동네 중심지가 넓은 주거지의 장보기·식사·의료를 나눠 맡고, HDB 재판매 플랫과 민간 콘도 후보도 폭이 넓다. 도심과의 거리는 늘어나지만 동부의 직장·가족 생활이나 넓은 생활권을 중시한다면 그 자체가 장점이 된다. 세 곳을 비교할 때는 침실 수만 맞추지 말고 전용 또는 바닥면적, 잔여 임대기간, 준공연도, 주택 유형, 역까지의 실제 접근과 관리비를 같은 기준으로 정리한다."
          ],
          "en": [
            "Tiong Bahru's scarce appeal lies in conserved low-rise SIT blocks, compact market-centred streets and a city-fringe position, but layouts, lifts and parking can vary sharply by block. Queenstown, Singapore's first satellite town, contains several generations of housing: older HDB stock around Commonwealth and Mei Ling, high-rise replacement developments at Dawson, and private condominiums towards Alexandra. A 'Queenstown average' therefore says less than the station, precinct and project named in the transaction.",
            "Tampines works at the scale of a planned HDB town. Its town centre, MRT and bus interchange and multiple neighbourhood centres distribute shopping, food and services across a broad residential area; the search can include a deep resale-flat stock as well as private condominiums. It is farther from the central area, yet can be the more connected choice for an eastern workplace, family network or town-based routine. Compare floor area, remaining lease, completion year, housing type, actual station access and monthly charges—not bedrooms alone—across all three."
          ]
        },
        "links": [
          {
            "href": "/news/singapore-ccr-rcr-ocr-comparison/",
            "label": {
              "ko": "CCR·RCR·OCR의 실제 거래 비교하기",
              "en": "Compare transactions across CCR, RCR and OCR"
            }
          },
          {
            "href": "/sg/singapore/explore/",
            "label": {
              "ko": "지역과 민간 프로젝트 살펴보기",
              "en": "Explore areas and private projects"
            }
          }
        ]
      },
      {
        "id": "which-home",
        "title": {
          "ko": "보존 플랫, HDB, 콘도는 서로 다른 서류를 읽어야 합니다",
          "en": "Historic flat, HDB resale or condo: read a different file"
        },
        "paragraphs": {
          "ko": [
            "티옹바루의 오래된 플랫은 곡선 외관만 볼 것이 아니라 잔여 임대기간, 내부 평면, 보존 지침이 수리에 미치는 영향, 엘리베이터 접근과 블록 관리 상태를 확인한다. HDB 재판매 플랫은 HFE 자격과 민족통합정책·영주권자 할당 등 해당 블록의 거래 조건, 최소거주기간, 공식 재판매 절차를 살펴야 한다. 오래된 퀸스타운 플랫과 비교적 새 탐피니스 플랫도 남은 임대기간과 향후 수선의 무게가 다르다.",
            "민간 콘도는 자유보유권인지 임대권인지, 남은 기간, 관리비와 적립금, 단지 규모, 준공 상태를 최근 유사 거래와 비교한다. 신규 분양은 전시용 유닛의 마감보다 실제 평면, 인도 시점과 지급 일정이 중요하고, 재판매 주택은 현재 상태와 바로 확인할 수 있는 단지 운영이 장점이다. 수영장 수보다 출입구에서 역까지의 길, 오후 햇빛, 도로·MRT 소음, 쓰레기와 배송 동선처럼 반복해서 쓰는 조건이 후보를 더 잘 가른다."
          ],
          "en": [
            "For an older Tiong Bahru flat, look past the façade to remaining lease, internal plan, conservation constraints on alterations, lift access and block condition. An HDB resale requires a different file: HFE eligibility, transaction conditions that can include the Ethnic Integration Policy and Singapore Permanent Resident quota, minimum occupation requirements and the official resale process. An older Queenstown flat and a later Tampines flat may offer similar space but carry very different lease and renewal questions.",
            "For a private condominium, compare freehold or leasehold tenure, remaining term, maintenance charges and reserves, project scale and completion status with recent like-for-like transactions. A new launch asks the buyer to judge a plan, handover and payment schedule; a resale unit exposes its present condition and operating estate. The route from gate to train, afternoon sun, road or rail noise, waste collection and delivery access usually separate candidates more effectively than the number of leisure facilities in the brochure."
          ]
        },
        "links": [
          {
            "href": "/sg/singapore/check/",
            "label": {
              "ko": "민간 프로젝트의 제시가격 확인하기",
              "en": "Check a private-project offer"
            }
          }
        ]
      },
      {
        "id": "make-it-happen",
        "title": {
          "ko": "옵션을 행사하기 전에 매수자와 집을 한 번 더 맞춥니다",
          "en": "Match the named buyers to the named property before exercising the option"
        },
        "paragraphs": {
          "ko": [
            "최종 후보가 HDB라면 HFE와 해당 가구·블록의 자격을 확인하고 HDB 재판매 절차에 맞춰 일정을 잡는다. 콘도라면 Option to Purchase 조건, 행사기한, 대출 승인, 인지세, 법률 비용과 잔금일을 하나의 자금표로 만든다. 해외 매수자는 SLA 승인 대상 부동산인지도 주소와 소유 형태로 확인한다. 주택 유형이 달라지면 계약 순서와 현금이 필요한 시점도 달라진다.",
            "자금표에는 매매가뿐 아니라 BSD·해당되는 ABSD, 금융비용, 관리비 선납과 입주 직후 수리비를 반영한다. 공동매수라면 지분과 가장 높은 세 부담을 유발할 수 있는 매수자 조건, 자금 출처를 변호사와 세무 전문가에게 설명한다. 티옹바루의 희소한 블록이든 탐피니스의 실용적인 콘도든, 정확한 호수와 정확한 매수자 명단으로 공식 안내를 다시 확인한 뒤 계약해야 숫자가 실제 거래가 된다."
          ],
          "en": [
            "If the finalist is an HDB resale, confirm the HFE outcome and the household's and block's eligibility, then follow the HDB resale timetable. For a condominium, map the Option to Purchase terms and exercise deadline against financing approval, duties, legal costs and completion. An overseas buyer should also confirm from the address and title whether the property falls within SLA's restricted categories. Different housing systems require cash at different moments.",
            "The cash plan should include the price, BSD, any applicable ABSD, financing costs, advance maintenance payments and immediate works. For joint buyers, give the lawyer and tax adviser the ownership shares, buyer profiles and source of funds because the highest applicable profile may affect duty. Whether the choice is a scarce Tiong Bahru block or a practical Tampines condominium, rerun the official checks using the exact unit and exact purchasers before exercising the option."
          ]
        },
        "links": [
          {
            "href": "/guides/singapore-condo-buying-budget-guide/",
            "label": {
              "ko": "싱가포르 콘도 매입 예산 정리하기",
              "en": "Plan the Singapore condo buying budget"
            }
          }
        ]
      }
    ],
    "sources": [
      {
        "title": "National Heritage Board · Tiong Bahru Heritage Trail",
        "href": "https://www.roots.gov.sg/places/places-landing/trails/tiong-bahru-heritage-trail"
      },
      {
        "title": "Housing & Development Board · Queenstown",
        "href": "https://www.hdb.gov.sg/about-us/our-towns-and-estates/queenstown"
      },
      {
        "title": "Housing & Development Board · Tampines",
        "href": "https://www.hdb.gov.sg/about-us/our-towns-and-estates/tampines"
      },
      {
        "title": "Housing & Development Board · Buying a Flat and HFE eligibility",
        "href": "https://www.hdb.gov.sg/buying-a-flat"
      },
      {
        "title": "Singapore Land Authority · Foreign ownership of property",
        "href": "https://www.sla.gov.sg/regulatory/foreign-ownership-of-property/"
      },
      {
        "title": "Inland Revenue Authority of Singapore · Additional Buyer's Stamp Duty",
        "href": "https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29"
      },
      {
        "title": "Urban Redevelopment Authority · Private residential property data",
        "href": "https://www.ura.gov.sg/property-data/private-residential-properties/"
      },
      {
        "title": "Land Transport Authority · East-West Line",
        "href": "https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/rail_network/east_west_line.html"
      }
    ]
  },
  {
    "city": "dubai",
    "name": {
      "ko": "두바이",
      "en": "Dubai"
    },
    "title": {
      "ko": "두바이에서 집을 고를 때, 스카이라인보다 오래 남는 것",
      "en": "Choosing a Dubai home after the skyline has won you over"
    },
    "deck": {
      "ko": "마리나의 수변 생활, JLT의 일상성, 비즈니스 베이의 도심 접근성. 세 동네의 차이를 완공 여부와 관리비, 지급 시점까지 이어서 읽는다.",
      "en": "Marina waterfront life, JLT’s everyday practicality and Business Bay’s central address—read the differences through completion status, service charges and the timing of your money."
    },
    "sections": [
      {
        "id": "discover",
        "title": {
          "ko": "휴일의 풍경을 평일의 동선으로 바꿔 보기",
          "en": "Turn a holiday view into a weekday routine"
        },
        "paragraphs": {
          "ko": [
            "두바이 마리나는 물가를 따라 산책로와 식당, 고층 주거동이 이어져 있어 도시를 처음 만나는 사람에게도 생활 장면이 쉽게 그려진다. 하지만 같은 마리나 주소라도 트램 정류장이나 메트로 연결 지점까지의 길, 주차장 진출입, 저녁 시간의 보행 혼잡은 타워마다 다르다. 바다나 마리나 전망이 없는 방향의 집도 있고, 낮에는 밝지만 도로 소음이 직접 닿는 집도 있다. 조망보다 먼저 현관에서 슈퍼마켓과 교통수단까지 실제 경로를 읽어야 하는 이유다.",
            "JLT는 호수와 타워 클러스터를 중심으로 카페, 식료품점, 사무실이 섞여 있어 건물 아래에서 해결할 수 있는 일이 많다. 비즈니스 베이는 운하와 도심 업무지구가 맞닿지만, 주거동 주변의 보도와 영업 중인 상가 밀도는 블록별 편차가 크다. RTA의 노선도에는 마리나·JLT의 트램과 메트로 연결, 비즈니스 베이역이 표시된다. 다만 역 이름만으로 집의 접근성이 결정되지는 않는다. 도보 구간과 큰 도로를 건너는 방식까지 확인해야 같은 ‘역세권’ 안의 차이가 보인다."
          ],
          "en": [
            "Dubai Marina makes daily life easy to picture: towers, restaurants and a promenade follow the water. Yet two Marina addresses can work very differently. The walk to a tram stop or Metro connection, the route in and out of the car park and evening foot traffic all depend on the tower. Some apartments face away from the water; others gain daylight but also hear the main road. Before paying for a view, trace the ordinary trip from the lobby to groceries and transport.",
            "JLT clusters towers around lakes, with cafés, food shops and offices often close to the building. Business Bay places homes beside the canal and a major business district, but the quality of the pavement and the amount of operating retail can change from block to block. RTA’s rail map shows the tram and Metro connections around Marina and JLT and the Business Bay Metro station. A station name is still only part of the answer: the walk and the road crossings decide how useful that access feels every day."
          ]
        },
        "links": [
          {
            "href": "/ae/dubai/",
            "label": {
              "ko": "두바이 주택 시장 살펴보기",
              "en": "Explore Dubai’s housing market"
            }
          }
        ]
      },
      {
        "id": "why-buy",
        "title": {
          "ko": "투자 이야기보다 먼저, 이 집의 역할을 정하기",
          "en": "Decide what the home is for before discussing returns"
        },
        "paragraphs": {
          "ko": [
            "마리나의 완공 아파트를 직접 살 집으로 사는 사람과, 비즈니스 베이의 분양권을 장기 투자로 사는 사람은 같은 시장을 보더라도 판단 기준이 다르다. 직접 거주한다면 입주 가능한 날짜, 매일 쓰는 공간, 냉방과 주차, 반려동물이나 가족에게 필요한 시설이 중심이 된다. 임대 목적이라면 현재 임차인이 원하는 평면과 건물 운영 상태, 공실 중에도 계속 나가는 비용이 더 중요하다.",
            "광고에 나온 총수익률은 이런 차이를 지운다. 임대료에서 관리비, 수선, 임대 관리, 공실과 가구 교체 비용을 빼면 소유자가 실제로 받는 현금은 달라진다. 완공 주택은 현재 임대 사례와 건물 상태를 확인할 수 있지만, 분양 주택은 아직 존재하지 않는 임대료와 미래의 관리비를 가정해야 한다. 따라서 ‘두바이 집값이 오를까’보다 ‘이 집을 언제부터 어떻게 쓰고, 비용을 얼마나 감당할까’가 먼저다."
          ],
          "en": [
            "A buyer choosing a completed Marina apartment as a home is not making the same decision as an investor taking an off-plan position in Business Bay. An owner-occupier cares about the usable move-in date, layout, cooling, parking and facilities that suit the household. A landlord needs to understand the floor plans tenants currently choose, how the building operates and which costs continue through an empty period.",
            "A promoted gross yield erases those differences. The cash an owner keeps changes after service charges, repairs, letting management, vacancy and furnishing. A completed unit offers present-tense evidence: existing rents, an operating building and a physical apartment. An off-plan unit asks the buyer to assume a future rent and an as-yet untested cost base. The useful question is therefore not simply whether Dubai prices will rise, but when the home can begin doing its intended job and what it will cost while it does."
          ]
        },
        "links": [
          {
            "href": "/news/dubai-rental-yield-after-costs/",
            "label": {
              "ko": "임대수익에서 빠지는 비용 읽기",
              "en": "Read what sits behind a rental yield"
            }
          }
        ]
      },
      {
        "id": "can-i-buy",
        "title": {
          "ko": "외국인 소유 가능성과 지불 가능성은 다른 질문",
          "en": "Permission to own and capacity to pay are different questions"
        },
        "paragraphs": {
          "ko": [
            "두바이 토지부는 외국인의 부동산 소유가 프리홀드 지역에서 가능하다고 안내한다. 도시 전체에 같은 규칙이 적용된다고 가정해서는 안 된다. 관심 단지와 특정 호수가 외국인 명의로 등록 가능한지, 매도인의 권리와 해당 계약이 DLD 기록에 어떻게 표시되는지부터 확인해야 한다. 소유 가능성에 대한 답이 나와도 금융 승인이 따라오는 것은 아니다. 거주 상태, 소득 증빙, 매수 목적에 따라 대출 가능 여부와 필요한 자기자금이 달라진다.",
            "완공 주택은 계약금 이후 잔금과 대출 실행, 이전 비용이 비교적 짧은 구간에 모일 수 있다. 분양 주택은 공사 중 할부가 이어지거나 인도 시 큰 금액이 남는 등 계약별 지급 구조가 다르다. 그래서 같은 매매가격이라도 통장에서 돈이 빠져나가는 시점은 전혀 다를 수 있다. 생활비와 비상자금을 남긴 뒤 각 날짜에 동원할 수 있는 현금만 계산하면, 살 수 있는 가격과 무리 없이 보유할 수 있는 가격의 차이가 드러난다."
          ],
          "en": [
            "Dubai Land Department states that foreign ownership is available in freehold areas; it should not be assumed to apply identically across the whole city. Confirm that the project and particular unit can be registered in the buyer’s name, and verify how the seller’s interest and the contract appear in DLD records. An ownership answer is not a finance approval. Residence, documented income and purchase purpose can all change the lending decision and the cash a buyer must provide.",
            "With a completed home, the deposit, balance, loan drawdown and transfer costs may gather into a relatively short period. An off-plan contract can call for instalments during construction, a substantial handover payment or another project-specific sequence. Two homes with the same purchase price can therefore make very different demands on cash. Calculate only the money available on each date after preserving living expenses and an emergency reserve; that reveals the difference between a price you can sign for and a home you can continue to hold."
          ]
        },
        "links": [
          {
            "href": "/guides/dubai-ready-apartment-buying-budget-guide/",
            "label": {
              "ko": "완공 아파트의 매입 예산 구성하기",
              "en": "Build a budget for a completed apartment"
            }
          }
        ]
      },
      {
        "id": "where",
        "title": {
          "ko": "마리나·JLT·비즈니스 베이, 비슷한 타워 생활의 다른 결",
          "en": "Marina, JLT and Business Bay: three versions of tower life"
        },
        "paragraphs": {
          "ko": [
            "두바이 마리나는 물가 산책과 식사, 해변 접근을 일상의 중심으로 삼기 좋지만 관광객과 방문 차량이 많은 구간도 있다. 후보는 고층 아파트가 대부분이므로 전망 방향, 발코니의 실제 활용도, 엘리베이터 대기와 주차 동선이 집의 만족도를 크게 바꾼다. JLT 역시 타워형 주거가 중심이지만 호수별 클러스터와 근린 상가가 생활 단위를 만든다. 마리나의 휴양지 분위기보다 장보기와 식사, 사무실을 가까운 범위에서 해결하는 편의를 선호하는 사람에게 다른 답이 된다.",
            "비즈니스 베이는 도심 업무지구와 운하 주변의 신축·신규 공급이 눈에 띈다. 다만 주거 전용 타워, 호텔식 운영, 상업시설이 섞인 건물은 관리 방식과 공용시설 사용 조건이 다를 수 있고, 아직 공사가 이어지는 블록은 완성된 거리와 같은 평가를 할 수 없다. 세 지역을 비교할 때는 ‘침실 두 개’라는 광고 문구만 맞추지 말고 실내 유효면적, 완공 연도, 주차, 냉방 비용의 부담 주체, 현재 영업 중인 상가를 같은 항목으로 본다. 그러면 선호하는 풍경이 아니라 감당할 수 있는 생활 형태로 후보가 좁혀진다."
          ],
          "en": [
            "Dubai Marina suits buyers who want the waterfront walk, restaurants and beach access to shape daily life, though some sections also carry heavy visitor and vehicle traffic. Most choices are high-rise apartments, so aspect, the real usefulness of a balcony, lift demand and car-park access materially change the experience. JLT is also tower-led, but its lake clusters and local retail create smaller everyday zones. It offers a different answer for someone who values groceries, meals and an office close by more than a resort atmosphere.",
            "Business Bay stands close to a major employment district and includes prominent new and recent development around the canal. Residential towers, hotel-style operations and mixed-use buildings can carry different management arrangements and rules for shared facilities; a block still under construction cannot be judged like a settled street. Across all three areas, compare usable internal space, completion year, parking, who bears cooling costs and which shops are actually open—not just the advertised bedroom count. That turns three appealing skylines into a choice between distinct forms of daily life."
          ]
        },
        "links": [
          {
            "href": "/ae/dubai/explore/",
            "label": {
              "ko": "두바이 지역별 완공·분양 거래 비교하기",
              "en": "Compare completed and off-plan activity by area"
            }
          }
        ]
      },
      {
        "id": "which-home",
        "title": {
          "ko": "같은 가격의 두 타워가 매년 다른 비용을 만든다",
          "en": "Two towers at one price can produce very different annual bills"
        },
        "paragraphs": {
          "ko": [
            "완공 아파트에서는 실내보다 건물 운영 기록이 더 많은 것을 말해줄 때가 있다. 공용부 청결과 냉방, 수영장·체육관, 엘리베이터, 누수나 외벽 보수는 모두 소유 비용과 연결된다. DLD는 RERA 승인을 받은 서비스 차지가 프로젝트마다 서비스 종류, 공용부 규모, 세대 수 등에 따라 달라진다고 설명한다. 현재 승인액만 보지 말고 과거 청구와 납부 여부, 포함 항목, 예정된 큰 수선을 확인해야 저렴해 보이는 매물이 실제로도 저렴한지 판단할 수 있다.",
            "분양 주택에는 아직 확인할 수 없는 항목이 많다. 모델하우스의 마감재가 계약서와 사양서에 어떻게 적혀 있는지, 면적과 주차, 공용시설 이용권, 인도 조건이 무엇인지 문서로 읽어야 한다. DLD의 Dubai REST에서는 프로젝트 진행률과 에스크로 계좌, 투자자의 지급 예정액 등 프로젝트 정보를 확인할 수 있다. 완공 주택의 현 상태와 분양 주택의 약속을 한 표에 섞지 않고, 각각 확인 가능한 자료의 종류와 남은 불확실성을 표시하는 편이 공정한 비교다."
          ],
          "en": [
            "In a completed apartment, the building’s operating record may say more than the interior. Cleaning, cooling of common areas, pools, gyms, lifts, leaks and façade repairs all connect to ownership cost. DLD explains that RERA-approved service charges vary by project according to the services, common areas and number of units. Look beyond the current approved figure to previous demands, payment status, inclusions and planned major work. A discounted apartment can cease to look cheap once the building is included.",
            "An off-plan home contains more things that cannot yet be inspected. Read how the show-home finish appears in the contract and specification, and identify the documented unit area, parking, shared-facility rights and handover conditions. Dubai REST provides project information including progress, the escrow account and payments due from an investor. Do not place the observable condition of a completed building and the promises of a future one in the same column. Record what evidence exists for each—and what remains uncertain."
          ]
        },
        "links": [
          {
            "href": "/ae/dubai/check/",
            "label": {
              "ko": "제시가격과 예상 임대수익 확인하기",
              "en": "Check an asking price and gross yield"
            }
          }
        ]
      },
      {
        "id": "make-it-happen",
        "title": {
          "ko": "계약일이 아니라, 열쇠를 받는 날까지 자금을 본다",
          "en": "Plan beyond signing day to the moment the keys arrive"
        },
        "paragraphs": {
          "ko": [
            "마음에 드는 집이 완공 매물이라면 매매 계약과 DLD 이전, 기존 대출 말소, 새 대출 실행, 잔금의 순서가 서로 맞아야 한다. 분양 매물이라면 계약상 할부일과 공사 진행, 인도 후 발생할 관리비와 가구 비용까지 자금 계획에 반영해야 한다. 인도가 늦어질 때 현재 집의 임차료를 더 내야 하는지, 반대로 준비한 현금이 예상보다 오래 묶이는지도 판단을 바꿀 수 있다.",
            "실제로 매수를 진행할 때는 매물별 권리와 계약, 등록 상태를 전문가와 확인하고, 가이드의 완공 주택 절차와 비용 항목을 자신의 지급 일정에 옮기면 된다. 최종 후보는 조망이 가장 화려한 집이 아니라, 인도 시점이 바뀌어도 현금과 생활을 지킬 수 있는 집이어야 한다."
          ],
          "en": [
            "For a completed resale, the sale contract, DLD transfer, discharge of an existing mortgage, drawdown of a new loan and payment of the balance must work in sequence. For an off-plan purchase, contractual instalments need to sit beside construction progress and the service charges and furnishing costs that begin after handover. A delay may extend the rent on your present home or leave committed cash unavailable for longer than expected; either can change the decision.",
            "When moving ahead, have the title, contract and registration position checked for the specific property, then use the completed-home guide to place each cost and procedure on your own payment calendar. The strongest final candidate is not necessarily the most dramatic view. It is the home that still protects your cash and daily life if the timetable moves."
          ]
        },
        "links": [
          {
            "href": "/ae/dubai/guide/",
            "label": {
              "ko": "두바이 매수 절차와 비용 확인하기",
              "en": "Follow the Dubai purchase guide"
            }
          },
          {
            "href": "/guides/dubai-ready-apartment-buying-budget-guide/",
            "label": {
              "ko": "완공 아파트 예산 가이드 열기",
              "en": "Open the completed-apartment budget guide"
            }
          }
        ]
      }
    ],
    "sources": [
      {
        "title": "Dubai Land Department · Frequently Asked Questions",
        "href": "https://dubailand.gov.ae/en/frequently-asked-questions/"
      },
      {
        "title": "Dubai Land Department · Dubai REST",
        "href": "https://dubailand.gov.ae/en/eservices/dubai-rest/"
      },
      {
        "title": "Dubai Roads and Transport Authority · Metro and tram stations map",
        "href": "https://www.rta.ae/wps/portal/rta/ae/public-transport/metro-stations-map"
      },
      {
        "title": "Visit Dubai · Dubai Marina",
        "href": "https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/dubai-marina"
      }
    ]
  },
  {
    "city": "tokyo",
    "name": {
      "ko": "도쿄",
      "en": "Tokyo"
    },
    "title": {
      "ko": "카구라자카·고엔지·기요스미시라카와에서 고르는 세 가지 도쿄",
      "en": "Three Tokyos: choosing between Kagurazaka, Koenji and Kiyosumi-Shirakawa"
    },
    "deck": {
      "ko": "골목과 상점가, 강 동쪽의 넓은 하늘. 동네의 표정부터 구축 맨션의 수선계획과 비거주자 금융까지 한 채의 선택으로 연결한다.",
      "en": "Lanes, shopping streets and the open sky east of the river—connect the character of each neighborhood to an older condo’s repair plan and the realities of non-resident finance."
    },
    "sections": [
      {
        "id": "discover",
        "title": {
          "ko": "역 이름 하나로 설명되지 않는 도쿄의 일상",
          "en": "Daily Tokyo is larger than a station name"
        },
        "paragraphs": {
          "ko": [
            "카구라자카는 큰길의 경사와 돌이 깔린 작은 골목, 오래된 요정과 새 식당이 가까운 거리 안에서 바뀌어 나타난다. 도자이선 카구라자카역만 보는 대신 이다바시역과 우시고메카구라자카역 중 어느 쪽을 자주 쓸지도 생각해야 한다. 같은 동네에서도 언덕 위와 아래, 큰길과 골목 안쪽은 장보기와 귀가 동선, 소음이 다르다. ‘카구라자카에 산다’는 말보다 어느 출구에서 어느 길로 집에 가는지가 생활을 더 정확히 설명한다.",
            "고엔지는 역 앞 상점가와 작은 술집, 라이브하우스, 헌옷가게가 저층 주거 골목으로 번진다. 늦은 시간까지 활기가 있는 대신 역 가까운 집은 소리와 사람 흐름을 확인해야 한다. 기요스미시라카와는 카페와 현대미술관, 기요스미정원, 운하와 강 주변의 평평한 길이 전혀 다른 주말을 만든다. 한조몬선과 오에도선을 쓸 수 있지만, 박물관 쪽과 강 쪽의 생활 반경은 다르다. 세 곳은 모두 ‘도쿄 접근성’이 좋다는 한 문장으로 묶기 어려운 동네다."
          ],
          "en": [
            "Kagurazaka changes within a few streets: a sloping main road gives way to stone lanes, long-established ryotei and newer restaurants. Looking only at Kagurazaka Station on the Tozai Line misses the possible approaches from Iidabashi and Ushigome-kagurazaka. The upper and lower slopes, the main road and a home inside the lanes produce different grocery trips, noise and walks home. The route from the exit to the front door describes life here better than the neighborhood name alone.",
            "Koenji’s station-front shopping streets, small bars, live houses and vintage shops spill into low-rise residential lanes. That energy runs late, so a home near the station also requires attention to sound and foot traffic. Kiyosumi-Shirakawa offers another weekend: coffee, contemporary art, Kiyosumi Gardens and flatter streets beside canals and rivers. The Hanzomon and Oedo lines serve the station, but life toward the museum differs from life toward the water. All three are well connected in the broad sense; none can be reduced to that phrase."
          ]
        },
        "links": [
          {
            "href": "/jp/tokyo/",
            "label": {
              "ko": "도쿄 주택 시장 살펴보기",
              "en": "Explore Tokyo’s housing market"
            }
          }
        ]
      },
      {
        "id": "why-buy",
        "title": {
          "ko": "좋아하는 동네가 소유할 집의 조건이 될 때",
          "en": "When a favorite neighborhood becomes an ownership decision"
        },
        "paragraphs": {
          "ko": [
            "카구라자카의 골목이 좋아도 필요한 방 수를 포기해야 한다면 매일의 만족이 오래가지 않을 수 있다. 고엔지의 문화와 상점가를 즐기지만 재택근무가 잦다면 소리와 작업 공간이 더 중요해진다. 기요스미시라카와의 공원과 평평한 길이 가족 생활에 맞더라도 실제로 자주 가는 직장이나 학교의 노선이 불편할 수 있다. 매수 이유는 동네에 대한 호감에 ‘이 집을 몇 년 동안 어떤 생활에 쓸 것인가’를 더한 문장이어야 한다.",
            "직접 살 집과 임대할 집은 같은 맨션이어도 장점이 달라진다. 실거주자는 수납, 채광, 이웃 소음과 관리 상태를 매일 겪는다. 해외에서 보유하는 임대인은 관리조합의 통지와 수선 결정, 세입자 대응, 세금·송금 업무를 대신 처리할 체계가 필요하다. 나중에 팔 가능성까지 생각한다면 개성적인 실내보다 다른 매수자도 이해하기 쉬운 평면, 건물 관리와 권리 형태가 중요할 수 있다. 소유의 이유가 분명해야 동네의 매력을 과대평가하지 않는다."
          ],
          "en": [
            "Loving Kagurazaka’s lanes may not compensate for giving up a room the household needs. Koenji’s culture and shops may be the attraction, but someone working from home will feel noise and workspace more keenly. Kiyosumi-Shirakawa’s parks and flatter streets may suit family life while the actual school or work route does not. A reason to buy should add a second sentence to affection for the area: what life will this home support, and for how many years?",
            "A home and a rental property also extract different value from the same condominium. A resident experiences storage, light, neighbor noise and management every day. An overseas landlord needs a way to receive management-association notices, respond to repair decisions, manage tenants and handle tax and remittance work. If resale is plausible, an unusual renovation may matter less than a legible layout, sound building management and clear rights. A precise purpose prevents neighborhood charm from doing all the decision-making."
          ]
        },
        "links": []
      },
      {
        "id": "can-i-buy",
        "title": {
          "ko": "살 수 있다는 말과 대출받을 수 있다는 말 사이",
          "en": "The distance between being able to buy and being able to borrow"
        },
        "paragraphs": {
          "ko": [
            "일본 재무성의 외환법 안내는 비거주자의 일본 부동산 취득을 전제로 사후 신고가 필요한 경우와 예외를 설명한다. 즉 비거주자가 취득 당사자가 되는 문제와, 은행이 그 사람에게 주택담보대출을 제공하는 문제는 분리해서 봐야 한다. 국적만 묻고 구매 가능성을 판단하거나, 일본에 사는 외국인의 대출 사례를 해외 거주자에게 그대로 적용하면 예산이 쉽게 틀어진다. 거주자 여부와 취득 목적, 소유 명의, 필요한 신고를 거래별로 확인해야 한다.",
            "도쿄스타은행의 현재 Star Mortgage는 영주권이 없는 외국인을 대상으로 하지만 일본 거주, 일본 내 근무·소득 이력, 본인 또는 동거 가족의 주거 목적 등 별도의 조건을 둔다. 같은 은행은 일본 비거주자를 위한 부동산 투자대출도 별도 상품으로 표시한다. 이는 특정 상품을 추천하기 위한 예가 아니라 시장의 구조를 보여준다. 실거주 외국인, 영주권자, 해외 거주 투자자는 같은 ‘외국인 매수자’가 아니며, 대출 사전심사 전에는 예상 대출금을 확정 자금으로 계산해서는 안 된다."
          ],
          "en": [
            "Japan’s Ministry of Finance guidance under the Foreign Exchange and Foreign Trade Act expressly addresses post-transaction reporting by non-residents acquiring Japanese real property, including when reporting is required and when an exemption may apply. That is a separate question from whether a bank will finance the acquirer. Asking only about nationality—or applying the loan experience of a foreign resident in Japan to a buyer overseas—can produce a false budget. Residence status, acquisition purpose, ownership structure and applicable reporting need transaction-specific answers.",
            "Tokyo Star Bank’s current Star Mortgage serves foreign nationals without permanent residence, but adds conditions including residence in Japan, Japanese work and income history, and use as the applicant’s or cohabiting family’s home. The bank separately points to a real-estate investment loan for non-residents. This is not a product recommendation; it shows why ‘foreign buyer’ is not one lending category. A resident without permanent status, a permanent resident and an overseas investor can face different routes. Until pre-screening is complete, proposed debt should not be treated as cash in hand."
          ]
        },
        "links": [
          {
            "href": "https://www.tokyostarbank.co.jp/foreign/en/products/loan/homeloan_star/",
            "label": {
              "ko": "은행이 공개한 신청 조건 확인하기",
              "en": "Read the bank’s published eligibility terms"
            }
          }
        ]
      },
      {
        "id": "where",
        "title": {
          "ko": "세 동네의 집은 평면 밖에서도 달라진다",
          "en": "The housing differences extend beyond the floor plan"
        },
        "paragraphs": {
          "ko": [
            "카구라자카에서는 중심 입지의 중층 맨션, 경사진 골목의 소규모 구축, 큰길의 비교적 새 집이 한 검색 결과에 섞일 수 있다. 역 선택지가 여러 개인 대신 언덕과 좁은 도로, 오래된 건물의 엘리베이터·주차 유무가 생활을 가른다. 고엔지는 역 주변 상업지에서 조금만 벗어나면 저층 공동주택과 단독주택이 이어진다. 같은 예산에서 면적이나 방 수를 확보할 가능성만 볼 것이 아니라, 목조 주택이 가까운 밀도, 골목 폭, 철도나 상점가에서 들리는 소리까지 확인해야 한다.",
            "기요스미시라카와에는 구축 맨션과 중층 주거, 창고·업무시설이 남은 거리, 새 주택이 섞여 있다. 평지의 자전거 생활과 공원·강 접근이 장점이지만 수변 저지대의 주소라면 도쿄도의 재해 지도를 따로 확인할 이유가 있다. 이 비교에서 카구라자카는 골목과 복수 노선, 고엔지는 상점가와 저층 주거, 기요스미시라카와는 여유 있는 거리와 동쪽 도쿄의 수변 환경이 핵심이다. ‘역 도보 몇 분’만 맞춘 검색으로는 이 차이를 남길 수 없다."
          ],
          "en": [
            "A Kagurazaka search can mix mid-rise condominiums in a central location, small older buildings on sloping lanes and newer homes on larger roads. Multiple station choices help, while hills, narrow access, lifts and parking separate one building from another. Move beyond Koenji’s commercial streets and low-rise apartments and detached houses become more common. The possible gain in rooms or area must be read with the density of nearby wooden homes, lane width and sound from the railway or shopping streets.",
            "Kiyosumi-Shirakawa mixes older condominiums and mid-rise housing with streets that retain warehouses and workplaces, alongside newer homes. Flat cycling routes and access to parks and water are attractions; a low-lying waterside address also deserves a separate check against Tokyo’s hazard maps. Kagurazaka is a choice about lanes and several rail approaches, Koenji about shopping streets and low-rise residential fabric, and Kiyosumi-Shirakawa about more open streets and the waterside east. A search filtered only by minutes from the station loses those differences."
          ]
        },
        "links": [
          {
            "href": "/jp/tokyo/explore/",
            "label": {
              "ko": "도쿄 지역과 거래 범위 비교하기",
              "en": "Compare Tokyo areas and transaction evidence"
            }
          }
        ]
      },
      {
        "id": "which-home",
        "title": {
          "ko": "구축 맨션, 새 주방보다 먼저 볼 관리 기록",
          "en": "An older condo’s management history outlasts a renovated room"
        },
        "paragraphs": {
          "ko": [
            "새 바닥과 주방은 눈에 잘 들어오지만, 구축 맨션의 큰 비용은 전유부 밖에서 생길 수 있다. 외벽과 옥상 방수, 급배수관, 엘리베이터 같은 공용부는 관리조합이 장기수선계획과 수선적립금으로 다룬다. 국토교통성도 구매 예정자와 구분소유자가 적립금 수준을 판단할 수 있도록 별도 가이드라인을 제공한다. 적립금이 낮다는 사실만으로 좋은 조건이라 볼 수 없고, 당장 월 부담이 높다는 이유만으로 관리가 나쁘다고 단정할 수도 없다.",
            "확인할 것은 장기수선계획의 최근 개정일, 예정 공사의 범위와 시기, 현재 적립금 잔액과 연체, 월 적립금의 인상 계획, 최근 총회 의사록에 나온 갈등이나 큰 지출이다. 여기에 내진 관련 자료, 배관 교체 범위, 창호가 공용부인지 여부처럼 건물별 조건이 더해진다. 카구라자카의 작은 구축과 고엔지의 저층 맨션, 기요스미시라카와의 비교적 큰 단지는 같은 연식이어도 의사결정과 비용 배분이 다르다. 인테리어 사진은 한 세대를 보여주지만 이 문서들은 건물 전체의 미래를 보여준다."
          ],
          "en": [
            "New floors and a kitchen are easy to see, but an older condominium’s largest costs may sit outside the unit. The management association deals with façades, roof waterproofing, shared pipes and lifts through a long-term repair plan and repair reserve. Japan’s Ministry of Land, Infrastructure, Transport and Tourism publishes specific reserve guidance for prospective buyers, owners and associations. A low monthly reserve is not automatically a bargain, and a high current contribution does not by itself prove poor management.",
            "Ask when the long-term plan was last revised, what work and dates it anticipates, the reserve balance and arrears, planned increases and what recent meeting minutes say about disputed or exceptional spending. Building-specific questions include seismic documentation, the scope of pipe replacement and whether windows are treated as common property. A small Kagurazaka building, a low-rise Koenji condominium and a larger Kiyosumi-Shirakawa block can distribute decisions and costs differently even at the same age. Interior photographs show one unit; these records show the building’s future."
          ]
        },
        "links": [
          {
            "href": "https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk5_000052.html",
            "label": {
              "ko": "국토교통성 맨션 관리·수선 자료 보기",
              "en": "Read MLIT’s condominium management resources"
            }
          }
        ]
      },
      {
        "id": "make-it-happen",
        "title": {
          "ko": "환율과 대출, 잔금을 같은 달력에 표시하기",
          "en": "Put exchange, finance and the balance on one calendar"
        },
        "paragraphs": {
          "ko": [
            "해외 자금으로 도쿄 주택을 산다면 계약금과 잔금을 엔화로 마련하는 날짜가 가격만큼 중요하다. 대출을 쓰는 경우에는 사전심사와 본심사, 담보평가, 실행 시점이 매매계약의 해제 조건과 잔금일에 맞아야 한다. 현금 매수라도 송금 한도와 은행의 자금 출처 확인, 환율 변동을 위한 여유가 필요하다. 매입대금 밖에는 중개·등기·세금과 보험, 입주 전 수리, 관리비와 수선적립금이 기다린다.",
            "비거주자는 재무성의 최신 안내에서 취득 목적과 시점에 따라 외환법상 사후 신고 대상인지 확인해야 한다. 이 신고는 소유권 이전등기나 세무 신고와 같은 절차가 아니다. 실제 서류와 마감일은 중개인, 사법서사, 세무 전문가와 매물별로 정리하되, 좋아하는 동네의 집이 대출 지연이나 환율 변화, 예상보다 큰 수선 부담이 생겨도 보유 가능한가. 그 질문을 통과한 집이라야 카구라자카의 골목도, 고엔지의 밤도, 기요스미시라카와의 아침도 오래 누릴 수 있다."
          ],
          "en": [
            "For a Tokyo purchase funded from overseas, the dates on which the deposit and balance must be available in yen matter as much as the price. With debt, pre-screening, final approval, valuation and drawdown must fit the finance condition and completion date in the sale agreement. A cash buyer still needs room for transfer limits, source-of-funds checks and exchange-rate movement. Beyond the price sit agency, registration, tax and insurance costs, pre-move repairs, management fees and repair reserves.",
            "A non-resident should use the Ministry of Finance’s latest guidance to determine whether the acquisition purpose and date create a post-transaction reporting requirement under FEFTA. That report is not the same process as registration of ownership or tax filing. The broker, judicial scrivener and tax adviser can assign the property-specific documents and deadlines. Ask yourself: could this home remain affordable through a delayed loan, a currency move or a larger repair burden? Only then can its lanes, nightlife or quiet waterside mornings become a durable part of ownership."
          ]
        },
        "links": [
          {
            "href": "https://www.mof.go.jp/english/policy/international_policy/real_property/index.html",
            "label": {
              "ko": "비거주자 부동산 취득 신고 안내 확인하기",
              "en": "Check the non-resident acquisition-reporting guidance"
            }
          }
        ]
      }
    ],
    "sources": [
      {
        "title": "GO TOKYO · Kagurazaka",
        "href": "https://www.gotokyo.org/en/destinations/central-tokyo/kagurazaka/index.html"
      },
      {
        "title": "GO TOKYO · Kiyosumi-Shirakawa",
        "href": "https://www.gotokyo.org/en/destinations/eastern-tokyo/kiyosumi-shirakawa/index.html"
      },
      {
        "title": "Experience Suginami Tokyo · Koenji",
        "href": "https://experience-suginami.tokyo/koenji/"
      },
      {
        "title": "Tokyo Metro · Kagurazaka Station",
        "href": "https://www.tokyometro.jp/lang_en/station/kagurazaka/index.html"
      },
      {
        "title": "Ministry of Land, Infrastructure, Transport and Tourism · Condominium management",
        "href": "https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk5_000052.html"
      },
      {
        "title": "Tokyo Star Bank · Star Mortgage for non-permanent residents",
        "href": "https://www.tokyostarbank.co.jp/foreign/en/products/loan/homeloan_star/"
      },
      {
        "title": "Ministry of Finance Japan · Non-resident acquisition reporting",
        "href": "https://www.mof.go.jp/english/policy/international_policy/real_property/index.html"
      }
    ]
  }
];
export const STORY_STEPS = [
  { id: 'discover', label: { en: 'Discover', ko: '도시의 매력' }, question: { en: 'What would life here feel like?', ko: '여기서 살면 어떤 일상일까?' } },
  { id: 'why-buy', label: { en: 'Why buy?', ko: '집을 가질 이유' }, question: { en: 'Does owning fit your plans?', ko: '나에게 집을 갖는 의미는?' } },
  { id: 'can-i-buy', label: { en: 'Can I buy?', ko: '구매 가능성' }, question: { en: 'What is possible for you?', ko: '내 자금으로 어디까지 가능할까?' } },
  { id: 'where', label: { en: 'Where?', ko: '지역 선택' }, question: { en: 'Which neighbourhood fits?', ko: '어느 동네가 나에게 맞을까?' } },
  { id: 'which-home', label: { en: 'Which home?', ko: '집 선택' }, question: { en: 'What makes a good shortlist?', ko: '어떤 집을 후보로 남길까?' } },
  { id: 'make-it-happen', label: { en: 'Make it happen', ko: '자금과 구매' }, question: { en: 'How do you get to the keys?', ko: '자금 마련부터 계약까지 어떻게?' } },
] as const;

export function cityStoryHref(city: StoryCity, locale: StoryLocale = 'en') { return `${locale === 'ko' ? '/ko' : ''}/news/city-stories/${city}/`; }
