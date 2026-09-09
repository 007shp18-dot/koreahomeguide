export type StoryCity = 'seoul' | 'singapore' | 'dubai' | 'tokyo';
export type StoryLocale = 'en' | 'ko';
export type StoryText = Readonly<{ en: string; ko: string }>;
export type StoryLink = Readonly<{ href: string; label: StoryText }>;
export type StorySection = Readonly<{ id: string; title: StoryText; paragraphs: Readonly<{ en: readonly string[]; ko: readonly string[] }>; links: readonly StoryLink[] }>;
export type CityStory = Readonly<{ city: StoryCity; name: StoryText; title: StoryText; deck: StoryText; sections: readonly [StorySection, StorySection, StorySection, StorySection, StorySection, StorySection]; sources: readonly { title: string; href: string }[] }>;

export { STORY_STEPS } from './city-journey-routes';

export function cityStoryHref(city: StoryCity, locale: StoryLocale = 'en') { return `${locale === 'ko' ? '/ko' : ''}/news/city-stories/${city}/`; }

export const CITY_STORIES: readonly [CityStory, ...CityStory[]] = [
  {
    "city": "seoul",
    "name": {
      "en": "Seoul",
      "ko": "서울"
    },
    "title": {
      "en": "Love Seongsu? Find the Seoul home that fits your life",
      "ko": "성수가 좋아서 시작한, 서울 내 집 찾기"
    },
    "deck": {
      "en": "Seoul Forest, Wangsimni’s connections, Mangwon’s market streets. Decide which part of Seoul you want to make your own, then work out what that choice asks of your budget.",
      "ko": "서울숲 가까운 집, 왕십니에서 출퇴근하기 편한 집, 망원시장에서 장보는 일상. 마음이 가는 동네를 출발점 삼아, 내 생활과 예산에 맞는 집을 찾아본다."
    },
    "sections": [
      {
        "id": "discover",
        "title": {
          "en": "Seongsu has more than one kind of doorstep",
          "ko": "성수에서도 어느 골목에 살 것인가"
        },
        "paragraphs": {
          "en": [
            "Seongsu’s appeal starts with the contrast between its streets. Yeonmujang-gil brings cafes and shops into a district shaped by workshops and handmade shoes. Seoul Forest provides a different centre of gravity: a place to walk, read or make room for an unplanned afternoon. Both belong to Seongsu, but they suggest different ways to spend the hours outside your home.",
            "That distinction matters when choosing an address. Someone who wants to leave home for an early walk may begin with the park entrance; someone who works late may put the station and the route home first. Mark those actual destinations before drawing a search radius. Two homes advertised under the same neighbourhood name can make the same routine surprisingly different.",
            "Imagine carrying groceries home on a wet evening, opening the bedroom window, or meeting a friend after work. The useful question is which parts of Seongsu you would enjoy repeatedly. A favourite cafe can start the search; the streets between the station, shops and front door give it a shape."
          ],
          "ko": [
            "성수의 매력은 골목마다 풍경이 달라지는 데 있다. 연무장길에는 공장과 수제화 작업장의 흔적 사이로 카페와 상점이 들어서 있고, 서울숲 쪽으로 가면 산책과 휴식이 하루의 중심이 된다. 같은 성수라도 퇴근 후 가볍게 외식하고 싶은 사람과 아침마다 공원을 걷고 싶은 사람이 찾는 집은 달라질 수 있다.",
            "그래서 매물을 보기 전에 성수에서 자주 갈 곳부터 골라두면 좋다. 서울숲 입구가 가까워야 하는지, 늦게 귀가하는 날 역에서 집까지 걷는 길이 짧아야 하는지에 따라 후보가 달라진다. 지도에 찍힌 동네 이름이 같아도, 어느 역과 어느 골목을 이용하는지는 집마다 다르다.",
            "비 오는 저녁에 장을 봐서 돌아오는 길, 침실 창문을 열었을 때 들리는 소리, 퇴근 후 친구를 만날 장소까지 떠올려보자. 좋아하는 카페 하나에서 시작한 관심이 매일 누리고 싶은 생활로 이어질 때, 성수에서 어떤 집을 찾는지도 조금씩 분명해진다."
          ]
        },
        "links": [
          {
            "href": "/kr/seoul/",
            "label": {
              "en": "Get to know the Seoul market",
              "ko": "서울 주택 시장 살펴보기"
            }
          }
        ]
      },
      {
        "id": "why-buy",
        "title": {
          "en": "Decide what staying would give you",
          "ko": "이 동네에 오래 산다면 무엇이 좋아질까"
        },
        "paragraphs": {
          "en": [
            "Buying in Seoul may mean settling near work, keeping a child’s routines stable or making a home you can renovate around your own habits. Name the benefit you expect to keep for several years. If the attraction is mainly spending weekends in Seongsu, living elsewhere and visiting may meet that need; if your everyday life is already here, staying has a different value.",
            "Compare buying with renting a genuinely similar home. Alongside a purchase, place a realistic jeonse or monthly-rental option and account for the deposit committed in either case. Add borrowing costs, upkeep and the cost of a later move. These comparisons work best when the homes offer roughly the same space and journey to work.",
            "Then consider the change most likely to affect you: a different office, another household member or a period overseas. Would the home still be useful, and could you carry the costs while deciding what comes next? The reason to buy becomes stronger when the location, usable space and holding period fit together without requiring a price rise to make the plan work."
          ],
          "ko": [
            "서울에서 내 집을 갖는 이유는 저마다 다르다. 직장 가까이 자리를 잡고 싶거나, 아이의 생활 반경을 자주 바꾸고 싶지 않거나, 취향대로 고쳐 오래 살 집이 필요할 수 있다. 성수에서 주말을 보내는 것이 좋은지, 이미 이 동네를 중심으로 평일을 살고 있는지에 따라서도 구매의 의미는 달라진다.",
            "매수를 생각한다면 비슷한 면적과 출퇴근 조건을 갖춘 전세·월세도 함께 비교해 보자. 매입에 묶이는 자기자금과 임차보증금, 대출이자와 유지비, 다음 이사에 드는 비용을 같은 기간으로 계산한다. 집의 조건이 크게 다르면 매수와 임차의 차이보다 서로 다른 집의 차이를 비교하게 된다.",
            "직장이 바뀌거나 가족이 늘거나 한동안 해외에 머물게 되는 경우도 떠올려본다. 그때도 이 집을 쓸 수 있는지, 다음 결정을 내릴 때까지 비용을 감당할 수 있는지가 중요하다. 원하는 입지와 필요한 공간, 예상 거주기간이 맞아야 집값 전망에만 기대지 않고도 구매 이유를 설명할 수 있다."
          ]
        },
        "links": [
          {
            "href": "/tools/property-scenario/",
            "label": {
              "en": "Build your ownership-cost scenario",
              "ko": "내 조건으로 보유비용 계산하기"
            }
          }
        ]
      },
      {
        "id": "can-i-buy",
        "title": {
          "en": "Find the price range your cash can support",
          "ko": "예산을 정하면 바뀌는 서울의 지도"
        },
        "paragraphs": {
          "en": [
            "Start with the cash you can use after keeping a reserve for life after the move. A deposit payable at signing and a balance payable months later are different commitments, even when their total is manageable. If part of the money will come from the return of a rental deposit or another sale, put that date beside the amount.",
            "Ask a lender to assess your income, existing debt and intended property before counting on a loan. Keep taxes, professional fees, repairs and moving expenses outside the price you offer. For money held overseas, work with the amount that can arrive in won after conversion and transfer costs, with room for the exchange rate to move.",
            "Now test the map with a consistent brief. Our article on 59-square-metre Seoul apartment transactions below KRW 700 million is one defined comparison, not a promise of available homes in Seongsu. Use the same floor area, housing type and transaction period to see where your range has evidence behind it. That tells you whether to change the neighbourhood, accept less space or keep building your budget."
          ],
          "ko": [
            "예산의 출발점은 입주 후 쓸 돈을 남기고도 매입에 넣을 수 있는 현금이다. 계약할 때 바로 필요한 계약금과 몇 달 뒤 지급할 잔금은 준비 방식이 다르다. 전세보증금을 돌려받거나 기존 집을 팔아 마련할 돈이 있다면, 금액 옆에 실제로 들어오는 날짜까지 적어야 한다.",
            "대출은 소득과 기존 부채, 사려는 주택을 기준으로 금융기관에 확인한다. 세금과 중개·등기 비용, 수리비와 이사비는 집값과 따로 잡는다. 해외에 있는 자금을 쓴다면 외화 잔액만 보지 말고 환전과 송금 비용을 거쳐 원화로 얼마를 마련할 수 있는지도 살펴야 한다.",
            "그다음에는 같은 조건으로 서울의 거래를 비교한다. 전용 59㎡·7억원 이하 아파트 거래를 다룬 글은 비교 범위를 정한 사례이지, 성수에서 그 예산으로 집을 구할 수 있다는 뜻은 아니다. 면적과 주택 유형, 거래 기간을 맞춰보면 관심 동네를 바꿀지, 면적을 줄일지, 자금을 더 모을지 판단할 근거가 생긴다."
          ]
        },
        "links": [
          {
            "href": "/news/seoul-59sqm-under-700-million-2026/",
            "label": {
              "en": "See recent Seoul sales below KRW 700m",
              "ko": "서울 59㎡·7억원 이하 실거래 읽기"
            }
          },
          {
            "href": "/guides/buy-property-in-korea-as-foreigner/",
            "label": {
              "en": "Check the buying sequence",
              "ko": "외국인 매수 절차 확인하기"
            }
          }
        ]
      },
      {
        "id": "where",
        "title": {
          "en": "Seongsu, Wangsimni or Mangwon?",
          "ko": "성수, 왕십니, 망원에서 달라지는 선택"
        },
        "paragraphs": {
          "en": [
            "Keep Seongsu on the list if the forest and its workshop-and-cafe streets are central to the life you want. Separate homes near the park from those that suit the station or commercial streets. Once the search is this specific, you can ask what extra walking, smaller rooms or older building you would accept to keep your preferred location.",
            "Wangsimni offers another starting point: Lines 2 and 5, the Gyeongui–Jungang Line and the Suin–Bundang Line meet here, with shopping around the station. It is worth comparing when household members travel in different directions. Its food streets also give the area its own character. Check which entrance and transfer route each home would actually use; a large interchange does not make every nearby front door equally convenient.",
            "For a different version of neighbourhood life, consider Mangwon’s market streets and nearby Hangang park. If food shopping and riverside time are what you wanted from Seoul, it deserves a place beside the first two. Compare homes of the same type and size before making a price judgement. These are three distinct ways to arrange daily life, and none should be assumed cheaper from its name alone."
          ],
          "ko": [
            "서울숲과 성수의 상점·작업장이 있는 거리가 생활의 중심이라면 성수를 후보로 남긴다. 다만 공원 가까운 집과 역 이용이 편한 집, 상권 안쪽의 집을 나누어 볼 필요가 있다. 원하는 위치를 지키기 위해 면적이나 연식, 걷는 거리에서 어디까지 받아들일 수 있는지 정하면 매물 비교가 구체적이 된다.",
            "왕십리는 여러 방향으로 출퇴근하는 가족에게 비교할 만한 곳이다. 2·5호선과 경의중앙선, 수인분당선이 만나고 역 주변에 쇼핑시설이 모여 있다. 곱창거리처럼 동네의 오랜 먹거리도 남아 있다. 다만 환승역이 크다는 이유만으로 모든 집이 편한 것은 아니므로, 이용할 출입구와 실제 환승 동선을 기준으로 살펴보자.",
            "시장에서 장을 보고 한강을 걷는 생활이 끌린다면 망원도 함께 볼 수 있다. 망원시장과 가까운 망원한강공원이 성수와는 다른 일상을 만들어준다. 세 지역의 가격을 비교할 때는 같은 주택 유형과 면적을 맞춰야 한다. 어느 동네가 무조건 저렴하다고 정하기보다, 내가 원하는 생활을 어떤 집에서 누릴 수 있는지 확인하는 비교다."
          ]
        },
        "links": [
          {
            "href": "/kr/seoul/explore/",
            "label": {
              "en": "Compare neighbourhoods in Explore",
              "ko": "Explore에서 지역과 가격 비교하기"
            }
          }
        ]
      },
      {
        "id": "which-home",
        "title": {
          "en": "Compare the apartment, then the whole building",
          "ko": "같은 동네에서도 다른 집값의 이유"
        },
        "paragraphs": {
          "en": [
            "A sale nearby is useful only when you know what changed hands. Match exclusive floor area, floor, building age and contract date, then look for several comparable transactions. A renovated upper-floor apartment and an unrenovated lower-floor unit may share an address without offering the same evidence for an asking price. Record where the comparison is strong and where you still need an explanation.",
            "Within the home, work through a normal day: where a desk would fit, where laundry would dry and how much storage remains after the furniture arrives. Open the windows and check ventilation, daylight and noise. In Seongsu, examine the relationship to busy shopfronts; near Wangsimni, the route to the station matters as much as the distance stated in the listing.",
            "Then look beyond the private rooms. Ask about parking, common-area upkeep, previous repairs and planned work, and examine the relevant property documents with professional help. If a price depends on future redevelopment, separate what has been formally established from what is being suggested. The shortlist should make clear both why you like each home and what still needs to be resolved."
          ],
          "ko": [
            "근처에서 거래된 집이 있다고 해서 바로 가격 기준으로 삼을 수는 없다. 전용면적과 층, 연식, 계약일을 맞추고 여러 건을 살펴봐야 한다. 같은 단지라도 수리한 고층 집과 손볼 곳이 많은 저층 집은 조건이 다르다. 비교가 가능한 부분과 매도인에게 설명을 들어야 할 차이를 나누어 적어보자.",
            "집 안에서는 실제 하루를 보내는 순서로 살펴본다. 책상을 놓을 자리와 빨래를 말릴 공간이 있는지, 가구를 들인 뒤에도 수납이 충분한지 확인한다. 창문을 열어 환기와 소음을 보고 채광도 살핀다. 성수에서는 상점이 많은 거리와 집의 위치 관계를, 왕십니에서는 매물에 적힌 역까지의 거리와 실제 걷는 길의 차이를 눈여겨볼 만하다.",
            "공용부도 집의 일부다. 주차와 청소 상태, 지난 수선 내역과 앞으로 예정된 공사를 묻고, 권리관계 등 거래 서류는 전문가와 확인한다. 재개발 기대가 가격에 반영되어 있다면 공식적으로 진행된 단계와 앞으로의 기대를 구분한다. 좋은 후보 목록에는 마음에 드는 이유와 계약 전에 풀어야 할 질문이 함께 남아 있어야 한다."
          ]
        },
        "links": [
          {
            "href": "/kr/seoul/check/",
            "label": {
              "en": "Check an asking price",
              "ko": "제안받은 가격 확인하기"
            }
          }
        ]
      },
      {
        "id": "make-it-happen",
        "title": {
          "en": "Make the move and the money meet on the same day",
          "ko": "잔금일에 돈과 이사가 함께 맞아야 한다"
        },
        "paragraphs": {
          "en": [
            "The final budget should name the home and the payment dates. Set out the deposit, any interim payment and the balance, then identify the cash, borrowing or sale proceeds funding each one. A total that balances on paper can still fail if the money arrives after it is due. Resolve that gap before fixing the contract timetable.",
            "Connect the payment plan to possession of the home. Confirm the existing occupant’s moving date, when you can inspect the vacant property and how much time any repairs require. If your current rental ends before the new home is ready, include temporary accommodation and storage. Those practical dates can change how much a seemingly affordable purchase really needs.",
            "Before signing, have the transaction documents, financing conditions and payment arrangements checked for this property. Leave the agreed reserve untouched when you calculate what is available for the offer. You should finish with a home you can explain, a price supported by comparisons and a move that works for your household—the practical form of the life that first drew you to the neighbourhood."
          ],
          "ko": [
            "마지막 자금계획에는 실제로 살 집과 지급일이 들어가야 한다. 계약금과 중도금, 잔금을 언제 내는지 적고 각각 자기자금, 대출, 기존 주택 매각대금 중 무엇으로 충당할지 연결한다. 총액이 맞아도 돈이 늦게 들어오면 잔금을 치를 수 없다. 계약 일정을 정하기 전에 그 간격부터 해결해야 한다.",
            "자금 일정은 집을 넘겨받는 일정과도 맞물린다. 현재 거주자의 이사일과 빈집을 확인할 시점, 수리에 필요한 기간을 함께 확인하자. 지금 사는 집의 계약이 먼저 끝난다면 임시 거처와 짐 보관 비용도 필요하다. 이런 날짜들이 생각보다 매입 예산을 크게 바꿀 수 있다.",
            "계약 전에는 해당 주택의 서류와 대출 조건, 대금 지급 방식을 전문가와 확인한다. 미리 남겨두기로 한 생활비를 제안가격에 다시 보태지는 않는다. 왜 이 집을 골랐는지, 가격의 근거는 무엇인지, 가족의 이사 일정이 가능한지까지 설명할 수 있다면 동네에 대한 호감이 실제 구매 계획으로 이어진 셈이다."
          ]
        },
        "links": [
          {
            "href": "/guides/seoul-apartment-buying-budget-guide/",
            "label": {
              "en": "Work through the Seoul buying budget",
              "ko": "서울 매입 예산과 비용 정리하기"
            }
          }
        ]
      }
    ],
    "sources": [
      {
        "title": "Seoul Metropolitan Government · Yeonmujang-gil",
        "href": "https://english.seoul.go.kr/yeonmujang-gil-seongsu-dong-cafe-street/"
      },
      {
        "title": "Visit Seoul · Seongsu-dong, workshops and Seoul Forest",
        "href": "https://english.visitseoul.net/editorspicks/Seongsu-dong/ENNg9y9rs"
      },
      {
        "title": "Visit Seoul · Wangsimni station connections and shopping",
        "href": "https://english.visitseoul.net/shopping/E-mart-Wangsimni-Branch/ENP009885"
      },
      {
        "title": "Seoul Metropolitan Government · Wangsimni food streets",
        "href": "https://english.seoul.go.kr/pinpoint-the-location-hidden-gems-in-the-alleys-of-seoul/"
      },
      {
        "title": "Visit Seoul · Mangwon Market and nearby Hangang park",
        "href": "https://english.visitseoul.net/shopping/Mangwon-Market/ENP037950"
      }
    ]
  },
  {
    "city": "singapore",
    "name": {
      "en": "Singapore",
      "ko": "싱가포르"
    },
    "title": {
      "en": "Singapore: choose the neighbourhood before the condo",
      "ko": "싱가포르에서는 콘도보다 동네를 먼저 고른다"
    },
    "deck": {
      "en": "Tiong Bahru’s low-rise streets, Katong’s shophouses, Tampines’ town centre. Start with the routines you want, then compare the homes you can actually buy.",
      "ko": "티옹바루의 낮은 주거동, 카통의 숍하우스 거리, 탬피니스의 생활시설. 원하는 일상에서 출발해 매수 자격과 예산, 단지의 조건을 차례로 살펴본다."
    },
    "sections": [
      {
        "id": "discover",
        "title": {
          "en": "A market, a meal and the walk home",
          "ko": "시장에서 장을 보고 걸어서 집으로"
        },
        "paragraphs": {
          "en": [
            "In Tiong Bahru, curved corners and low-rise Art Deco buildings give the streets a scale that differs from a tower-and-pool condo brochure. The market and food centre add a practical anchor: a place to buy ingredients or eat without planning a special outing. The appeal is as much the ordinary trip downstairs as the neighbourhood’s architecture.",
            "That does not mean every home carrying the Tiong Bahru name offers the same routine. Mark the market, the station entrance and the building’s actual pedestrian gate. A route with a convenient crossing and shelter can matter more than a straight-line distance. Consider how you would make it with shopping bags, in the rain or after an evening out.",
            "Use that exercise across Singapore. What would you do outside the apartment several times a week, and what can the neighbourhood provide? The answer may favour a familiar food centre, easy connections or a well-used public space. Those choices help you decide whether a condo’s facilities add something valuable to your daily life."
          ],
          "ko": [
            "티옹바루에서는 둥글게 처리한 모서리와 아르데코 양식의 낮은 주거동이 먼저 눈에 들어온다. 고층 콘도와 수영장을 중심으로 보는 싱가포르와는 다른 풍경이다. 시장과 푸드센터가 있어 식재료를 사거나 한 끼를 해결하는 일도 동네 안에서 이어진다. 건축물의 멋만큼이나 집 밖으로 나가 평범한 하루를 보내기 좋다는 점이 매력이다.",
            "물론 티옹바루라는 이름이 붙은 모든 집에서 같은 생활을 할 수 있는 것은 아니다. 시장과 MRT 출입구, 단지의 실제 보행자 출입문을 지도에 찍어보자. 직선거리보다 횡단보도 위치와 비를 피할 수 있는 길이 더 중요할 수 있다. 장바구니를 들었을 때나 비가 오는 날에도 편하게 다닐 수 있는 길인지 살펴보면 좋다.",
            "이렇게 보면 싱가포르의 다른 지역도 비교하기 쉬워진다. 일주일에 여러 번 집 밖에서 무엇을 할지, 그 일을 동네에서 해결할 수 있는지를 묻는 것이다. 익숙한 식사 장소와 교통편, 자주 이용할 공공시설을 먼저 정하면 콘도의 부대시설이 내 생활에 얼마나 필요한지도 판단할 수 있다."
          ]
        },
        "links": [
          {
            "href": "/sg/singapore/",
            "label": {
              "en": "Explore Singapore’s housing market",
              "ko": "싱가포르 주택 시장 살펴보기"
            }
          }
        ]
      },
      {
        "id": "why-buy",
        "title": {
          "en": "Make a home fit the length of your stay",
          "ko": "싱가포르에서 얼마나 오래 살 집인가"
        },
        "paragraphs": {
          "en": [
            "A purchase makes a different commitment from another rental term. If your work and family are likely to stay in Singapore, control over the layout and continuity in one area may have real value. If the next move depends on a short assignment, first ask how owning would affect your freedom to leave or change neighbourhoods.",
            "Compare the same kind of home over your expected stay. Include acquisition costs, financing, monthly maintenance and eventual selling expenses. Do not let an appealing rental yield answer a question about your own family home: a unit that is easy to furnish for tenants may still lack the storage, work space or separation your household needs.",
            "If renting it out later is part of the plan, treat that as a separate scenario. Establish the applicable rules, management arrangements and realistic expenses for the specific property. Buying should have a clear purpose now, with a workable response if that purpose changes. This makes it easier to choose between central convenience, more usable space and keeping more money available for the rest of your life."
          ],
          "ko": [
            "집을 사면 다음 임대차계약보다 긴 시간을 생각하게 된다. 직장과 가족의 생활이 싱가포르에 오래 이어질 예정이라면 같은 지역에서 안정적으로 지내고 집을 취향에 맞게 꾸밀 수 있다는 점에 가치가 있다. 반대로 짧은 파견근무처럼 다음 이동이 정해지지 않았다면, 소유가 이사와 귀국의 선택에 어떤 영향을 주는지 먼저 생각해 볼 만하다.",
            "예상 거주기간을 정한 뒤 비슷한 집의 매수와 임차 비용을 비교한다. 취득비용과 대출, 매달 관리비, 향후 매도비용까지 포함한다. 가족이 직접 살 집이라면 임대수익률만으로 판단하기 어렵다. 임차인에게 보여주기 좋은 집이어도 우리 가족에게 필요한 수납이나 재택근무 공간, 방 사이의 분리는 부족할 수 있다.",
            "나중에 임대할 계획이라면 별도 시나리오로 계산한다. 해당 주택에 적용되는 규정과 관리 방법, 실제 지출을 확인하고 지금의 거주 계획과 구분해 두자. 현재 왜 사는지, 그 목적이 바뀌면 어떻게 할지 정리하면 중심지의 편리함과 더 넓은 공간, 자금 여유 중 어디에 무게를 둘지도 정하기 쉬워진다."
          ]
        },
        "links": [
          {
            "href": "/tools/property-scenario/?market=sg-singapore&currency=SGD",
            "label": {
              "en": "Compare the ownership costs",
              "ko": "싱가포르 보유비용 계산하기"
            }
          }
        ]
      },
      {
        "id": "can-i-buy",
        "title": {
          "en": "Establish eligibility before comparing prices",
          "ko": "가격을 비교하기 전에, 살 수 있는 주택부터"
        },
        "paragraphs": {
          "en": [
            "A low-rise flat in Tiong Bahru, an HDB resale flat in Tampines and a private condo are not interchangeable purchase options. Start by identifying the property category and your buyer profile. Citizenship, residency, household circumstances and existing ownership are questions to resolve with the relevant official guidance before a listing becomes a serious candidate.",
            "Build an individual cost sheet for each eligible option. Keep the price, buyer-related duties, legal costs and financing separate so you can see why two purchases with the same headline price might require different cash commitments. Use current official duty guidance and a lender’s assessment of your own circumstances rather than another buyer’s percentage or approval story.",
            "Finally, divide that cash by timing. What is due early in the transaction, what may be funded at completion and what must remain after moving? If your budget depends on selling an existing home or releasing other funds, establish when those amounts become available. Eligibility and payment timing together produce a shortlist you can actually pursue."
          ],
          "ko": [
            "티옹바루의 낮은 주거동, 탬피니스의 HDB 재판매 주택, 민간 콘도는 같은 방식으로 매수할 수 있는 선택지가 아니다. 먼저 개별 매물의 주택 구분과 자신의 매수 조건을 확인해야 한다. 국적과 거주 신분, 가족 구성, 기존 주택 보유 여부를 정리한 뒤 해당 유형의 공식 자격 안내를 살펴본다.",
            "매수 가능한 후보마다 비용표를 따로 만든다. 매매가격과 매수자 조건에 따른 세금, 법률 비용, 대출을 분리하면 표시가격이 같은 집에도 왜 필요한 현금이 달라지는지 알 수 있다. 세금은 현재 공식 안내를, 대출은 자신의 소득과 조건에 대한 금융기관의 검토를 기준으로 잡는다. 다른 사람이 승인받은 비율을 그대로 가져오기는 어렵다.",
            "마지막으로 현금을 지급 시점에 따라 나눈다. 거래 초기에 필요한 돈과 잔금 때 마련할 돈, 입주 후 남겨둘 돈이 각각 얼마인지 확인한다. 기존 집을 팔거나 다른 자산을 정리해야 한다면 실제 사용 가능한 날짜도 필요하다. 매수 자격과 자금 일정이 함께 맞아야 관심 매물이 실행 가능한 후보가 된다."
          ]
        },
        "links": [
          {
            "href": "/news/policy/singapore-absd-policy-status/",
            "label": {
              "en": "Check buyer-profile and duty questions",
              "ko": "매수자 조건과 세금 확인하기"
            }
          }
        ]
      },
      {
        "id": "where",
        "title": {
          "en": "Tiong Bahru, Katong or Tampines?",
          "ko": "티옹바루, 카통, 탬피니스의 서로 다른 일상"
        },
        "paragraphs": {
          "en": [
            "Tiong Bahru is a useful candidate if low-rise streets, food shopping and neighbourhood-scale outings draw you. Compare it with a central home around your actual workplace if the main goal is to simplify the working week. A prestigious central address is less useful than knowing which errands and journeys it genuinely removes from your day.",
            "Katong–Joo Chiat offers a different setting, with Peranakan heritage, colourful shophouses and a strong food identity. It is worth considering when neighbourhood dining and streets with a distinct architectural character matter to you. Trace each candidate’s route to transport: a broad district label can hide a substantial difference between two homes’ first and last part of the journey.",
            "Tampines gives the comparison another direction. HDB describes it as an established regional centre, with a town centre near the MRT and bus interchange. Consider whether doing more locally would offset a different commute. Use CCR, RCR and OCR as market reference labels, then compare eligible homes of similar size, tenure and sale type in the actual neighbourhoods. That produces a decision about how to live, as well as what to pay."
          ],
          "ko": [
            "낮은 건물이 이어지는 거리와 시장, 가까운 곳에서 식사하는 생활이 좋다면 티옹바루를 살펴볼 만하다. 출근 시간을 줄이는 것이 가장 중요하다면 실제 직장 주변의 중심지 주택과 비교해 본다. 유명한 주소인지보다 그 집에 살 때 하루의 어떤 이동이 줄어드는지를 확인하는 편이 선택에 도움이 된다.",
            "카통·주치앗은 또 다른 분위기를 갖고 있다. 페라나칸 문화와 색색의 숍하우스, 다양한 먹거리가 동네의 인상을 만든다. 외식할 곳이 많고 건축물의 개성이 뚜렷한 거리를 좋아한다면 후보가 될 수 있다. 다만 동네 이름만으로 교통을 판단하지 말고 집에서 이용할 역이나 버스정류장까지의 실제 경로를 비교해야 한다.",
            "탬피니스까지 넓히면 비교 기준이 달라진다. 지역 중심지로 자리 잡은 탬피니스에는 MRT역과 버스환승장 가까이에 타운센터가 있다. 생활에 필요한 일을 동네 안에서 더 많이 해결하는 것이 자신의 출퇴근 조건과 맞는지 살펴보자. CCR·RCR·OCR은 시장을 읽는 구분으로 활용하고, 실제 후보는 매수 가능한 주택끼리 면적과 보유 형태, 거래 유형을 맞춰 비교한다."
          ]
        },
        "links": [
          {
            "href": "/news/singapore-ccr-rcr-ocr-comparison/",
            "label": {
              "en": "Compare the three regions",
              "ko": "세 지역의 실제 가격 비교하기"
            }
          }
        ]
      },
      {
        "id": "which-home",
        "title": {
          "en": "A condo’s address is only the first filter",
          "ko": "콘도 이름 다음에는 동과 평면을 본다"
        },
        "paragraphs": {
          "en": [
            "Within one condo, the particular unit changes the experience. Place a dining table, work desk and ordinary storage on the floor plan; check how circulation and balconies affect the space you can use. Ask about sun exposure, ventilation and noise from roads or shared facilities. A larger advertised area is not automatically a more useful home.",
            "Read the project as well as the unit. Review tenure and remaining lease where relevant, maintenance charges, common facilities and the condition of a completed development. Then match recent transactions by size, floor and transaction type. A new-launch sale and a resale home available for inspection give different evidence and should not be treated as identical comparisons.",
            "Make the final choice explicit. Would you use the larger pool often enough to justify its place in the budget? Is a convenient pedestrian exit more valuable than a view? For each candidate, write down one advantage that improves daily life and one unresolved question. This keeps the shortlist focused when show-flat finishes and long amenity lists begin to look alike."
          ],
          "ko": [
            "같은 콘도에서도 어느 동의 어떤 세대인지에 따라 생활이 달라진다. 평면도에 식탁과 책상, 평소 쓰는 수납가구를 놓아보고 이동할 공간이 남는지 확인한다. 발코니를 포함한 면적이 실제 실내 사용면적과 어떻게 다른지도 살핀다. 햇빛이 들어오는 방향과 환기, 도로와 공용시설에서 생길 수 있는 소음도 세대별로 물어볼 내용이다.",
            "단지 전체의 조건도 읽어야 한다. 보유 형태와 해당되는 경우 남은 리스 기간, 관리비와 부대시설, 완공 단지의 유지 상태를 확인한다. 가격은 최근 거래 중 면적과 층, 거래 유형이 비슷한 사례를 찾는다. 신규 분양과 직접 상태를 확인할 수 있는 재판매 주택은 제공하는 근거가 달라 하나의 숫자로만 비교하기 어렵다.",
            "마지막에는 무엇에 비용을 지불할지 분명히 해본다. 큰 수영장을 자주 쓸지, 좋은 전망보다 편리한 보행자 출입문이 더 중요한지 따져보는 것이다. 후보마다 생활에 도움이 되는 장점 하나와 아직 해결하지 못한 질문 하나를 적어두면, 모델하우스의 마감재나 긴 시설 목록에 판단이 흐려지는 것을 줄일 수 있다."
          ]
        },
        "links": [
          {
            "href": "/sg/singapore/explore/",
            "label": {
              "en": "Find and compare projects",
              "ko": "단지와 거래 비교하기"
            }
          },
          {
            "href": "/sg/singapore/check/",
            "label": {
              "en": "Check a project offer",
              "ko": "제시가격 확인하기"
            }
          }
        ]
      },
      {
        "id": "make-it-happen",
        "title": {
          "en": "Match the purchase timetable to the move",
          "ko": "계약 일정과 이사 일정을 함께 맞추기"
        },
        "paragraphs": {
          "en": [
            "Turn the selected property’s terms into a dated schedule: deposits, duties, legal costs, loan drawdown and the final balance. Have the professionals handling the purchase explain the commitments and deadlines before you sign. The useful budget is the one showing when each payment leaves your account, not just the eventual purchase total.",
            "If you are choosing between a completed home and a new launch, add your present housing to both schedules. A completed unit may require an early move and renovation; a home delivered later may mean keeping a rental for longer. Use the particular contract and confirmed dates to calculate that overlap, and leave room for a change in the moving timetable.",
            "Set aside the first months of living costs, maintenance and furnishing after completion. Then return to the route that started the search: the market, station or town centre you wanted to use. The purchase is ready to advance when the home serves those routines and the payment schedule leaves you enough room to enjoy them."
          ],
          "ko": [
            "선택한 주택의 계약 조건을 바탕으로 계약금과 세금, 법률 비용, 대출 실행과 잔금 지급일을 정리한다. 서명하기 전에 거래를 맡는 전문가에게 각 단계에서 어떤 의무가 생기고 언제까지 이행해야 하는지 설명을 듣는다. 최종 합계뿐 아니라 통장에서 돈이 나가는 시점을 알 수 있어야 실제 자금계획이 된다.",
            "완공 주택과 신규 분양을 고민한다면 지금 살고 있는 집의 비용도 각각의 일정에 넣어본다. 완공 주택은 이사와 수리를 곧 준비해야 할 수 있고, 나중에 인도받는 집은 현재 임차기간이 길어질 수 있다. 개별 계약과 확인된 날짜를 기준으로 두 주거비가 겹치는 기간을 계산하고, 이사 일정이 바뀔 여지도 남겨둔다.",
            "입주 직후의 생활비와 관리비, 가구 구입비를 마련한 뒤 처음 원했던 동선을 다시 떠올려보자. 시장과 MRT역, 타운센터를 일상에서 편하게 이용할 수 있는가. 그 생활에 맞는 집을 고르고도 지급 일정에 여유가 남는다면, 이제 구매를 구체적으로 진행할 준비가 된 것이다."
          ]
        },
        "links": [
          {
            "href": "/guides/singapore-condo-buying-budget-guide/",
            "label": {
              "en": "Plan the Singapore buying budget",
              "ko": "싱가포르 매입 예산 정리하기"
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
        "title": "National Heritage Board · Tiong Bahru Market & Food Centre",
        "href": "https://www.roots.gov.sg/stories-landing/stories/Hawker-Centres/Tiong-Bahru-Market-Food-Centre"
      },
      {
        "title": "Singapore Tourism Board · Katong–Joo Chiat",
        "href": "https://www.visitsingapore.com/neighbourhood/featured-neighbourhood/katong-joo-chiat/"
      },
      {
        "title": "Housing & Development Board · Tampines",
        "href": "https://www.hdb.gov.sg/about-us/our-towns-and-estates/tampines"
      },
      {
        "title": "Housing & Development Board · Tampines Town Centre",
        "href": "https://www.hdb.gov.sg/managing-my-home/living-in-my-community/exploring-my-neighbourhood/explore-my-town/tampines/tampines-town-centre"
      },
      {
        "title": "Land Transport Authority · Bus Network",
        "href": "https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/bus_network.html"
      }
    ]
  },
  {
    "city": "dubai",
    "name": {
      "en": "Dubai",
      "ko": "두바이"
    },
    "title": {
      "en": "Dubai: choose the life behind the view",
      "ko": "두바이의 전망 너머, 내가 살 동네 고르기"
    },
    "deck": {
      "en": "Marina’s promenade, JLT’s lakes and restaurants, Downtown’s cultural landmarks. Follow the daily journeys, then compare the building costs and payment schedules behind each address.",
      "ko": "마리나의 수변 산책로, JLT의 호수와 식당, 다운타운의 공연장과 쇼핑시설. 원하는 생활에서 출발해 건물별 유지비와 실제 자금 일정을 살펴본다."
    },
    "sections": [
      {
        "id": "discover",
        "title": {
          "en": "A waterfront view, and a route you will use",
          "ko": "창밖의 수변과 매일 걷게 될 길"
        },
        "paragraphs": {
          "en": [
            "Dubai Marina makes the appeal of a waterfront home easy to imagine. Marina Walk gives the towers a promenade at ground level, while nearby Jumeirah Beach Residence brings the beach into the picture. The practical distinction is where your chosen building sits in that setting: a view of the water and an easy route to spend time beside it are separate features.",
            "Jumeirah Lakes Towers, or JLT, offers another version of waterside living. Its lakes, park and independent restaurants create a different set of neighbourhood destinations. Downtown brings another choice again, with Dubai Mall and Dubai Opera among its anchors. These places offer different ways to spend an ordinary evening, even before you compare apartment sizes or prices.",
            "Begin with three journeys: work, groceries and the place you would go to unwind. Trace them from the building entrance using the transport you intend to use, including the walk and any connections. Ask how the route works during hotter weather as well as on a pleasant evening. That turns an attractive district into a candidate for everyday life."
          ],
          "ko": [
            "두바이 마리나에서는 수변에 사는 모습을 쉽게 떠올릴 수 있다. 고층 건물 아래로 마리나 워크 산책로가 이어지고, 가까운 주메이라 비치 레지던스(JBR)에서는 해변을 즐길 수 있다. 집을 고를 때는 창밖으로 물이 보이는지와 실제로 물가까지 편하게 나갈 수 있는지를 따로 살펴보면 좋다. 같은 전망을 내세우는 건물도 출입구에서 시작되는 길은 다를 수 있다.",
            "주메이라 레이크 타워스(JLT)는 호수와 공원, 개성 있는 식당을 중심으로 또 다른 수변 생활을 보여준다. 다운타운에는 두바이 몰과 두바이 오페라처럼 쇼핑과 공연을 즐길 장소가 있다. 세 지역은 평일 저녁을 보내는 방식부터 다르다. 면적과 가격에 앞서 어느 쪽 일상이 자신에게 맞는지 생각해 볼 만하다.",
            "먼저 직장과 장보는 곳, 쉬거나 운동하러 갈 장소 세 곳을 지도에 찍는다. 이용할 교통수단에 맞춰 건물 출입구부터 경로를 확인하고, 걷는 구간과 환승도 포함한다. 날씨 좋은 저녁뿐 아니라 더운 시기에도 자주 이용할 수 있을지를 생각하면, 마음에 드는 풍경이 실제 거주 후보로 구체화된다."
          ]
        },
        "links": [
          {
            "href": "/ae/dubai/",
            "label": {
              "en": "Get to know the Dubai market",
              "ko": "두바이 시장 살펴보기"
            }
          }
        ]
      },
      {
        "id": "why-buy",
        "title": {
          "en": "Decide whether you are buying a home or an income",
          "ko": "직접 살 집인가, 임대수입을 위한 집인가"
        },
        "paragraphs": {
          "en": [
            "For a home of your own, the central comparison is with renting something that supports the same life. A Marina apartment may be valuable to you because you would use the promenade regularly; a different address may make workdays easier. Set an expected holding period and compare financing, service charges, upkeep and moving costs alongside those benefits.",
            "For a rental purchase, begin with a full year of money in and money out. Deduct service charges, repairs, management and a realistic allowance for time without a tenant. Keep gross yield distinct from the cash remaining after these costs and any debt payments. A furnished unit also needs a budget for replacing the items that help it rent.",
            "If the plan combines personal use and letting, write down when the home will be available and verify which arrangements apply to that property. Your own stays reduce the time available to generate income, while management still needs an answer when you are elsewhere. Giving the home one clear primary role makes the choice of district, layout and operating budget much more coherent."
          ],
          "ko": [
            "직접 살 집이라면 같은 생활을 누릴 수 있는 주택을 임차했을 때와 비교한다. 마리나 산책로를 자주 이용한다면 그 입지에 개인적인 가치가 있고, 다른 지역이 평일 출퇴근을 더 편하게 해줄 수도 있다. 예상 보유기간을 정하고 대출비용과 관리비, 수선비와 이사비를 이런 생활상의 이점과 함께 살펴본다.",
            "임대 목적이라면 일 년 동안 들어오고 나갈 돈부터 계산한다. 임대료에서 건물 관리비와 수선비, 관리 대행비, 임차인이 없는 기간의 부담을 빼야 한다. 총 임대수익률과 비용·대출 상환 뒤에 남는 현금은 다르다. 가구를 갖춰 임대할 집이라면 가구와 가전을 교체할 예산도 필요하다.",
            "본인이 쓰면서 일부 기간 임대할 생각이라면 사용 일정을 정하고 해당 부동산에 적용되는 방식과 조건을 확인한다. 직접 머무는 기간에는 임대수입을 기대할 수 없고, 해외에 있는 동안에도 관리할 사람은 필요하다. 이 집의 주된 목적을 먼저 정하면 지역과 평면, 운영비를 서로 맞춰 결정하기 쉬워진다."
          ]
        },
        "links": [
          {
            "href": "/news/dubai-rental-yield-after-costs/",
            "label": {
              "en": "Read the costs behind rental yield",
              "ko": "두바이 임대수익과 비용 읽기"
            }
          }
        ]
      },
      {
        "id": "can-i-buy",
        "title": {
          "en": "Ready or off-plan changes the cash question",
          "ko": "완공 주택과 분양 주택은 자금 질문부터 다르다"
        },
        "paragraphs": {
          "en": [
            "Before comparing budgets, confirm that your buyer circumstances and the specific property allow the intended purchase. Then set aside the price, registration-related costs, professional fees and financing in separate lines. For overseas funds, establish what must arrive in dirhams and when. A foreign-currency balance is not yet a payment plan.",
            "A completed, or Ready, apartment gives you a building and unit to inspect, but the payment timetable may require substantial funds at transfer. An off-plan purchase spreads commitments according to its contract and introduces a future handover. Smaller early instalments do not establish affordability unless you can also fund the later ones.",
            "Make one dated cash schedule for each route. For Ready, connect the transfer and any borrowing to the date you receive possession. For off-plan, mark each contractual payment and test how you would fund the balance if an expected loan or asset sale is unavailable. Compare the two schedules alongside housing costs until you can actually use the new home."
          ],
          "ko": [
            "예산을 비교하기 전에 자신의 매수 조건과 해당 부동산이 예정한 취득 방식에 맞는지 확인한다. 그다음 매매대금과 등록 관련 비용, 전문가 비용, 대출을 따로 적는다. 해외 자금을 쓴다면 디르함으로 얼마를 언제까지 마련해야 하는지도 확인한다. 외화가 통장에 있다는 것만으로 지급 준비가 끝나는 것은 아니다.",
            "완공 주택인 Ready는 실제 건물과 세대를 확인할 수 있지만, 소유권 이전 시점에 큰 금액을 준비해야 할 수 있다. 분양 주택인 Off-Plan은 계약에 따라 돈을 나누어 내고 나중에 인도받는다. 초기 납입금이 작다는 이유만으로 부담이 적다고 판단하기보다 뒤에 남은 지급액까지 마련할 수 있는지 보아야 한다.",
            "두 선택지의 자금 일정을 각각 만들어보자. 완공 주택은 소유권 이전과 대출 실행, 집을 넘겨받는 시점을 맞춘다. 분양 주택은 계약상 지급일을 모두 적고, 예상한 대출이나 자산 매각이 이루어지지 않아도 잔여대금을 준비할 방법이 있는지 살핀다. 실제 사용할 수 있을 때까지의 주거비를 더해야 두 방식을 비교할 수 있다."
          ]
        },
        "links": [
          {
            "href": "/guides/dubai-ready-apartment-buying-budget-guide/",
            "label": {
              "en": "Work through a Ready-apartment budget",
              "ko": "두바이 완공 아파트 예산 살펴보기"
            }
          }
        ]
      },
      {
        "id": "where",
        "title": {
          "en": "Marina, JLT or Downtown?",
          "ko": "마리나, JLT, 다운타운을 비교하는 기준"
        },
        "paragraphs": {
          "en": [
            "Keep Marina on the list if a promenade and access towards JBR are central to how you want to live. Compare the actual tower entrances, local transport connections and the route to your workplace. A home that looks close to everything in a skyline photograph can still place a very different journey between you and the places you use.",
            "JLT is worth considering when the lakeside park and local restaurants suit your routine. Place it beside Marina as a distinct neighbourhood choice, then compare particular buildings. Test supermarket access, the route to transport and the time spent getting out of the building or parking area. An area's reputation cannot answer those building-level questions.",
            "Choose Downtown as a third candidate if you would make regular use of its shopping and cultural venues, including Dubai Opera. Then compare similar-sized completed apartments across the three areas, with service charges and condition beside the sale evidence. Keep future development plans in a separate column from what already operates. The result should explain what you gain and what you accept with each location."
          ],
          "ko": [
            "수변 산책로와 JBR 해변을 오가는 생활이 중요하다면 마리나를 후보로 남긴다. 이때는 건물 출입구와 주변 교통편, 직장까지 가는 길을 구체적으로 비교한다. 스카이라인 사진에서는 모든 것이 가까워 보여도 실제 자주 갈 장소까지의 이동은 건물마다 다를 수 있다.",
            "호수 옆 공원과 동네 식당을 이용하는 생활이 맞는다면 JLT를 함께 본다. 마리나의 대체재라는 생각에 그치지 말고, 별개의 동네로 놓고 건물을 비교해 보자. 장보러 가는 길과 대중교통 접근, 건물이나 주차장에서 빠져나오는 동선은 개별 매물에서 확인해야 한다. 지역의 평판만으로 답할 수 없는 부분이다.",
            "쇼핑과 공연을 생활 가까이 두고 싶다면 다운타운이 세 번째 후보가 될 수 있다. 두바이 오페라 같은 시설을 얼마나 자주 이용할지 생각해 본 뒤, 세 지역의 비슷한 면적 완공 아파트를 비교한다. 거래가격 옆에 관리비와 건물 상태를 적고, 향후 개발계획과 이미 운영 중인 시설을 구분하면 각 입지에서 얻는 것과 받아들일 조건이 드러난다."
          ]
        },
        "links": [
          {
            "href": "/ae/dubai/explore/",
            "label": {
              "en": "Compare Dubai areas",
              "ko": "두바이 지역 비교하기"
            }
          }
        ]
      },
      {
        "id": "which-home",
        "title": {
          "en": "Ask for the building’s running costs",
          "ko": "집값 옆에 건물의 운영비를 적는다"
        },
        "paragraphs": {
          "en": [
            "Start a completed-home review with the recurring costs. Request the service-charge basis and statements relevant to the unit, and ask which services are included or billed separately. Clarify cooling and utility arrangements, parking allocation and known maintenance issues. These answers let you compare the annual commitment of two towers with similar asking prices.",
            "Inside, inspect the usable layout, fittings and condition rather than relying on the view. Check how the balcony and orientation affect the space you would use, and ask about the performance and servicing of the cooling system. Include common areas and lifts in the review. A polished lobby does not settle how the building is maintained over time.",
            "For off-plan, replace observations you cannot yet make with specific documentary questions: what the sale includes, the stated completion and handover terms, the payment schedule and how the project information can be verified. Have the relevant professionals examine the documents. Keep unresolved points visible beside the price so a rendering does not become an assumption in your budget."
          ],
          "ko": [
            "완공 주택을 검토할 때는 반복해서 나가는 비용부터 확인한다. 해당 세대의 관리비 부과 기준과 내역을 요청하고, 어떤 서비스가 포함되며 무엇을 별도로 내는지 묻는다. 냉방과 공공요금의 청구 방식, 주차 배정, 알려진 수선 문제도 확인할 내용이다. 그래야 호가가 비슷한 두 건물의 연간 부담을 비교할 수 있다.",
            "실내에서는 전망과 함께 실제 평면과 설비 상태를 살핀다. 발코니와 집의 방향이 사용할 공간에 어떤 영향을 주는지, 냉방설비가 어떻게 관리되어 왔는지 물어본다. 공용부와 승강기도 확인한다. 로비가 잘 꾸며져 있다는 첫인상만으로 장기간의 건물 관리 상태까지 알 수는 없다.",
            "분양 주택은 아직 직접 볼 수 없는 부분을 구체적인 서류 질문으로 바꿔야 한다. 매매에 포함되는 항목과 계약상 완공·인도 조건, 지급 일정, 사업 정보를 확인할 방법을 정리한다. 관련 전문가에게 서류를 검토받고 해결되지 않은 내용은 가격 옆에 남겨둔다. 조감도의 모습이 예산 속 확정 조건으로 바뀌지 않도록 하는 과정이다."
          ]
        },
        "links": [
          {
            "href": "/ae/dubai/check/",
            "label": {
              "en": "Check price and gross yield",
              "ko": "가격과 예상 임대수익 확인하기"
            }
          }
        ]
      },
      {
        "id": "make-it-happen",
        "title": {
          "en": "Plan for the day you can actually use the home",
          "ko": "열쇠를 받는 날까지 계산하기"
        },
        "paragraphs": {
          "en": [
            "Bring together the purchase contract, funding commitments and moving plan. Confirm which documents, approvals and payments are needed at each stage for your particular transaction, and who is responsible for them. Arrange currency transfers and any loan drawdown around verified deadlines rather than an informal target date.",
            "For a future handover, run a second schedule with a later move. Include the additional rent you would pay elsewhere, any financing costs and the period before rental income could begin. The point is to understand how long your available cash can carry the plan, then compare that result with the obligations in the contract.",
            "For a completed home, confirm occupancy, the agreed handover condition and the process for checking and receiving the unit. Reserve funds for initial repairs, furnishings and running costs. When both routes are clear, the choice between a Marina view, a JLT routine and a Downtown address can rest on a home you can fund and use as intended."
          ],
          "ko": [
            "매매계약과 자금 조달, 이사 계획을 함께 놓고 확인한다. 이 거래의 각 단계에서 어떤 서류와 승인, 지급이 필요한지, 누가 준비하는지 정리한다. 환전과 송금, 대출 실행도 막연한 예상일보다 확인된 기한에 맞춰 준비해야 한다.",
            "앞으로 인도받을 집이라면 입주가 늦어지는 일정도 하나 더 계산해 본다. 다른 곳에서 추가로 내야 할 임대료와 금융비용, 임대수입이 시작되지 않는 기간을 포함한다. 현재 자금으로 얼마나 오래 계획을 유지할 수 있는지 알아보고 계약상 의무와 함께 판단하는 것이 목적이다.",
            "완공 주택은 현재 점유 상태와 약속한 인도 조건, 세대를 점검하고 넘겨받는 절차를 확인한다. 초기 수리와 가구, 운영비에 쓸 돈도 남긴다. 여기까지 정리하면 마리나의 전망과 JLT의 생활, 다운타운의 입지를 실제로 자금을 마련해 원하는 시기에 사용할 수 있는 집이라는 기준으로 고를 수 있다."
          ]
        },
        "links": [
          {
            "href": "/ae/dubai/guide/",
            "label": {
              "en": "Prepare for a Dubai purchase",
              "ko": "두바이 구매 절차 준비하기"
            }
          }
        ]
      }
    ],
    "sources": [
      {
        "title": "Visit Dubai · Dubai Marina",
        "href": "https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/dubai-marina"
      },
      {
        "title": "Visit Dubai · Marina Walk",
        "href": "https://www.visitdubai.com/en/places-to-visit/marina-walk"
      },
      {
        "title": "Visit Dubai · Jumeirah Beach Residence and tram access",
        "href": "https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/jumeirah-beach-residence"
      },
      {
        "title": "Visit Dubai · Jumeirah Lakes Towers",
        "href": "https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/jumeirah-lakes-towers"
      },
      {
        "title": "Visit Dubai · JLT food trail",
        "href": "https://www.visitdubai.com/en/things-to-do/itineraries/jlt-foodie-trail"
      },
      {
        "title": "Visit Dubai · Downtown Dubai",
        "href": "https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/downtown-dubai"
      },
      {
        "title": "Visit Dubai · Dubai Opera",
        "href": "https://www.visitdubai.com/en/places-to-visit/dubai-opera"
      }
    ]
  },
  {
    "city": "tokyo",
    "name": {
      "en": "Tokyo",
      "ko": "도쿄"
    },
    "title": {
      "en": "Tokyo: from a favourite street to a home worth keeping",
      "ko": "도쿄의 좋아하는 골목에서, 오래 살 집으로"
    },
    "deck": {
      "en": "Nakameguro’s riverside, Kiyosumi Shirakawa’s gardens and coffee, Kagurazaka’s lanes. Connect the neighbourhood you love to the railway, building records and funding that make a purchase work.",
      "ko": "나카메구로의 강변, 기요스미시라카와의 정원과 커피, 카구라자카의 골목. 좋아하는 동네를 노선과 건물 관리, 자금계획까지 이어서 살펴본다."
    },
    "sections": [
      {
        "id": "discover",
        "title": {
          "en": "Three ways to spend an ordinary Tokyo afternoon",
          "ko": "도쿄에서 보내고 싶은 평범한 오후"
        },
        "paragraphs": {
          "en": [
            "Nakameguro starts with the Meguro River, the shops on its side streets and the cafes and restaurants beneath the railway. The cherry blossoms bring a distinct seasonal bustle, but a home here is also about the rest of the year: a familiar route for coffee, dinner or a walk. Decide whether you want the riverside itself or convenient access from a quieter candidate street.",
            "Kiyosumi Shirakawa suggests another rhythm. Coffee roasters share the wider area with Kiyosumi Gardens and the Museum of Contemporary Art Tokyo near Kiba Park. If a garden walk and an exhibition are the outings you would make regularly, these are useful anchors for a home search. Mark each destination rather than treating the whole district as one walkable point.",
            "Kagurazaka offers narrow lanes, restaurants and a choice of approaches from Kagurazaka, Iidabashi and Ushigome-Kagurazaka stations. Together, the three neighbourhoods show why Tokyo rewards a search below the citywide level. Start with the streets and journeys you want to repeat, then look for the apartment building that lets you keep them."
          ],
          "ko": [
            "나카메구로에서는 메구로강과 그 주변 골목의 상점, 철도 고가 아래 카페와 식당이 일상의 배경이 된다. 벚꽃철의 활기도 이곳의 한 모습이지만, 집을 고른다면 나머지 계절에 어디서 커피를 마시고 저녁을 먹고 걸을지도 생각하게 된다. 강변 바로 앞에 살고 싶은지, 주변 골목에서 편하게 오갈 수 있으면 충분한지부터 정해보자.",
            "기요스미시라카와에서는 다른 오후를 떠올릴 수 있다. 커피 로스터리와 기요스미 정원이 있고, 기바공원 쪽에는 도쿄도현대미술관이 있다. 정원을 걷고 전시를 보는 일이 주말의 중요한 부분이라면 집을 찾을 때 기준점이 될 만하다. 다만 동네 전체를 한곳처럼 생각하기보다 자주 갈 장소를 각각 지도에 표시하는 편이 좋다.",
            "카구라자카에는 좁은 골목과 음식점이 이어지고, 카구라자카역과 이다바시역, 우시고메카구라자카역에서 서로 다른 길로 들어갈 수 있다. 세 동네를 놓고 보면 도쿄라는 큰 이름보다 어느 길을 반복해서 다닐지가 생활을 더 구체적으로 보여준다. 그 길을 편하게 이용할 수 있는 건물을 찾는 데서 내 집 찾기를 시작할 수 있다."
          ]
        },
        "links": [
          {
            "href": "/jp/tokyo/",
            "label": {
              "en": "Start exploring Tokyo",
              "ko": "도쿄 살펴보기"
            }
          }
        ]
      },
      {
        "id": "why-buy",
        "title": {
          "en": "Choose the kind of Tokyo base you need",
          "ko": "도쿄에 어떤 거점을 갖고 싶은가"
        },
        "paragraphs": {
          "en": [
            "A permanent home, a place used during regular stays and a rental apartment are three different briefs. Put your likely pattern of use on a calendar. A compact Nakameguro base may serve frequent short stays, while living and working at home throughout the year may require a separate room, more storage and a different budget.",
            "Ownership continues when you are away. Decide who would deal with repairs, building correspondence and a problem inside the unit, and include their costs where relevant. If you intend to rent, verify the permitted use and management arrangements for that building rather than assuming any attractive apartment can follow the same rental model.",
            "Compare owning with renting over the period you realistically expect to keep the home, including acquisition, maintenance and eventual sale costs. A neighbourhood you love gives the choice meaning; a practical use plan gives it durability. Both should remain persuasive even if work or travel changes and you spend less time in Tokyo than you first imagined."
          ],
          "ko": [
            "계속 살 집과 자주 오갈 때 머물 집, 임대용 주택은 서로 다른 조건이 필요하다. 먼저 달력에 예상 사용 기간을 그려보자. 나카메구로의 작은 집이 짧은 체류에는 잘 맞아도, 일 년 내내 재택근무를 하며 살려면 별도 방과 수납이 더 필요할 수 있다. 같은 동네를 좋아하더라도 목적에 따라 찾아야 할 집이 달라진다.",
            "일본을 비운 동안에도 소유자의 일은 남는다. 수리와 관리조합의 연락, 세대 안에 문제가 생겼을 때 누가 대응할지 정하고 필요한 비용을 계산한다. 임대를 계획한다면 그 건물에서 가능한 이용 방식과 관리 방법부터 확인한다. 매력적인 매물이라는 이유만으로 생각한 임대 방식이 그대로 가능한 것은 아니다.",
            "현실적으로 보유할 기간을 정한 뒤 취득과 유지, 향후 매도비용까지 포함해 임차와 비교한다. 좋아하는 동네가 선택의 이유라면 구체적인 사용 계획은 오래 유지할 근거가 된다. 직장이나 여행 일정이 바뀌어 예상보다 도쿄에 덜 머물더라도 두 이유가 여전히 성립하는지 생각해 볼 만하다."
          ]
        },
        "links": []
      },
      {
        "id": "can-i-buy",
        "title": {
          "en": "A purchase plan needs your own financing answer",
          "ko": "외국인 대출 안내를 내 조건으로 읽기"
        },
        "paragraphs": {
          "en": [
            "Separate nationality, residency and the purpose of the home when discussing a loan. A foreign national working in Japan, someone living overseas and a buyer seeking rental income are not the same application. Explain where you live, how you earn and document income, and who will occupy the property before using a possible loan to set the price range.",
            "Tokyo Star Bank’s published Star Mortgage terms provide a useful example of that distinction. The product addresses foreign nationals without permanent residency who reside in Japan, and describes financing for the applicant’s or a cohabiting family member’s home. That is not evidence that an overseas buyer or rental property will qualify. Ask the bank to assess both you and the intended property under its current terms.",
            "Build the remaining budget in yen: available cash, conversion and transfer costs, purchase expenses, any work before moving and a reserve. If the plan depends on borrowing, keep the shortlist within financing that has been assessed for your situation. If paying in cash, the same schedule still matters because funds and documents must be ready when the contract requires them."
          ],
          "ko": [
            "대출을 문의할 때는 국적과 거주 상태, 주택의 용도를 나누어 설명해야 한다. 일본에서 일하는 외국인과 해외 거주자, 임대수입을 목적으로 사는 사람은 같은 신청 조건이 아니다. 어디에 살고 어떤 소득을 증빙할 수 있는지, 누가 그 집에 거주할지부터 설명한 뒤 가능한 대출을 예산에 반영한다.",
            "도쿄스타은행의 Star Mortgage 안내가 그 차이를 보여주는 사례다. 영주권이 없는 외국인을 대상으로 하지만 일본 거주 등의 조건이 있고, 본인이나 함께 사는 가족의 주거용 주택에 대한 자금 용도를 설명한다. 따라서 해외 거주자나 임대용 주택도 가능하다고 확대해서 읽어서는 안 된다. 현재 상품 조건에 따라 신청자와 해당 주택을 함께 검토받아야 한다.",
            "나머지 예산은 엔화로 정리한다. 사용 가능한 현금과 환전·송금 비용, 취득비용, 입주 전 공사비, 남겨둘 자금을 따로 잡는다. 대출이 필요하다면 본인 조건으로 검토된 범위 안에서 후보를 고른다. 전액 현금으로 사더라도 계약이 요구하는 시점에 돈과 서류가 모두 준비되어야 하므로 일정은 여전히 중요하다."
          ]
        },
        "links": [
          {
            "href": "https://www.tokyostarbank.co.jp/foreign/en/products/loan/homeloan_star/",
            "label": {
              "en": "Read the lender’s eligibility information",
              "ko": "은행의 상품·자격 안내 읽기"
            }
          }
        ]
      },
      {
        "id": "where",
        "title": {
          "en": "Choose the railway, then the street",
          "ko": "나카메구로와 기요스미시라카와 사이에서"
        },
        "paragraphs": {
          "en": [
            "Nakameguro gives you the Tokyu Toyoko and Tokyo Metro Hibiya lines. Kiyosumi-Shirakawa connects to the Hanzomon and Toei Oedo lines. Put your own workplace and regular destinations on those networks before comparing the two neighbourhoods. The same attractive cafe culture can sit beside very different journeys through Tokyo.",
            "Kagurazaka adds a useful third comparison because its different station approaches can suit different destinations. For each candidate home, name the station entrance you would use and follow the final walk. Check slopes, crossings, shops and the relationship to busy streets. A listing’s station distance is a starting measure; it does not describe the whole trip or the comfort of making it every day.",
            "Once those routes are clear, compare apartments with similar usable area and building age within each chosen pocket. Keep Tokyo prefecture figures, 23-ward averages and individual-neighbourhood evidence distinct, and identify whether the data describes asking prices or completed sales. This makes any extra cost easier to discuss: you can explain the journey, location or home condition you are choosing to pay for."
          ],
          "ko": [
            "나카메구로역에는 도큐 도요코선과 도쿄메트로 히비야선이, 기요스미시라카와역에는 한조몬선과 도에이 오에도선이 지난다. 두 동네를 비교할 때는 자신의 직장과 자주 갈 곳을 먼저 노선도에 놓아보자. 커피를 즐기기 좋은 동네라는 공통점이 있어도 도쿄 안에서 이동하는 방향과 환승은 달라진다.",
            "카구라자카는 이용할 역에 따라 접근 경로가 달라 세 번째 후보로 비교할 만하다. 각 매물에서 실제로 쓸 역 출입구를 정하고 마지막 도보 구간까지 살펴본다. 경사와 횡단보도, 상점, 번화한 거리와의 위치 관계도 중요하다. 매물에 적힌 역까지의 거리는 출발점일 뿐, 매일 그 길을 다니기 편한지까지 설명하지는 않는다.",
            "동선이 정해지면 각 지역에서 비슷한 사용면적과 연식의 아파트를 비교한다. 도쿄도 전체와 23구 평균, 특정 동네의 자료를 구분하고 호가인지 실제 거래가격인지도 확인한다. 그래야 가격 차이가 보일 때 어떤 이동의 편리함과 입지, 집의 상태에 비용을 더 쓰려는지 구체적으로 설명할 수 있다."
          ]
        },
        "links": [
          {
            "href": "/jp/tokyo/explore/",
            "label": {
              "en": "Open Tokyo area exploration",
              "ko": "도쿄 지역 탐색 열기"
            }
          }
        ]
      },
      {
        "id": "which-home",
        "title": {
          "en": "Read the records behind a renovated apartment",
          "ko": "리모델링한 실내 뒤에 있는 건물의 기록"
        },
        "paragraphs": {
          "en": [
            "A renovated apartment can make an older Tokyo building feel immediately appealing. Look closely at the work included: finishes, kitchen and bathroom upgrades do not answer every question about pipes, shared systems or the building itself. Ask what was replaced and what remains, then distinguish the private unit’s condition from the condition of the property you will own together with others.",
            "Request the management information, long-term repair plan, reserve position, past major works and relevant building assessments with professional help. Ask about planned contributions or increases and how the repair plan is funded. A low monthly payment is only one piece of evidence; the more useful question is whether the building has a workable plan for the work ahead.",
            "Bring the documents back to your own use of the home. Check building rules, storage, bicycle or car parking where needed, and the layout’s suitability for your routine. Keep repair commitments beside comparable sale prices. This lets you assess an older, well-located home on its actual condition and obligations, without letting either fresh interiors or age alone decide the purchase."
          ],
          "ko": [
            "리모델링을 마친 집은 오래된 도쿄 건물도 매력적으로 보이게 한다. 다만 공사 범위를 자세히 볼 필요가 있다. 마감재와 주방, 욕실을 바꾼 것만으로 배관과 공용설비, 건물 전체의 상태까지 알 수는 없다. 무엇을 교체했고 무엇이 남아 있는지 묻고, 세대 내부와 공동으로 소유하게 될 건물을 구분해서 살펴본다.",
            "전문가의 도움을 받아 관리 관련 자료와 장기수선계획, 수선적립금 현황, 과거 대규모 공사와 관련 점검자료를 요청한다. 예정된 추가 부담이나 인상 계획이 있는지, 앞으로의 공사비를 어떻게 마련할지도 질문한다. 매달 내는 금액이 낮다는 사실보다 필요한 수선을 감당할 계획이 있는지가 장기 보유에는 더 유용한 정보다.",
            "건물의 기록을 자신의 사용 계획과 연결해 본다. 관리규약과 수납, 필요한 경우 자전거·자동차 주차, 평면이 일상에 맞는지 살핀다. 가격 비교 옆에 수선 관련 부담도 적어두면 좋은 입지의 구축을 실제 상태와 의무에 따라 판단할 수 있다. 새로 꾸민 실내나 건물 나이 한 가지에 결정을 맡기지 않게 되는 것이다."
          ]
        },
        "links": []
      },
      {
        "id": "make-it-happen",
        "title": {
          "en": "Bring yen, documents and handover into one plan",
          "ko": "엔화 자금과 서류, 인도 일정을 한 번에"
        },
        "paragraphs": {
          "en": [
            "Agree the purchase timetable only after mapping the deposit, balance, transaction expenses and any loan drawdown. If funding is overseas, confirm the transfer route and the documents your bank and transaction professionals need. Keep currency conversion and money arrival as separate steps, with enough time to resolve an unexpected documentation request.",
            "Clarify who will handle the contract documents, registration and handover, especially if you will not be in Japan throughout the process. Japan’s Ministry of Finance publishes a separate FAQ on non-resident acquisition reporting. Use the current guidance to establish what applies to your acquisition and arrange the appropriate professional support; do not treat ownership registration as an answer to every reporting question.",
            "Finally, decide how the home will be looked after from the day you receive it. Arrange any repairs, utilities and ongoing contact with management, including periods when you are abroad. A purchase in Nakameguro, Kiyosumi Shirakawa or Kagurazaka becomes a durable Tokyo base when the payment plan, building obligations and everyday use all have an answer."
          ],
          "ko": [
            "계약금과 잔금, 거래비용, 대출 실행일을 정리한 뒤 매입 일정을 확정한다. 해외 자금을 쓴다면 송금 경로와 은행·거래 담당자가 요구하는 서류를 확인한다. 환전을 마치는 일과 실제로 돈이 도착하는 일을 별도 단계로 보고, 추가 서류를 요청받았을 때 대응할 시간도 확보한다.",
            "계약 서류와 등기, 주택 인도를 누가 맡는지도 분명히 한다. 전 과정 동안 일본에 머물지 않는다면 특히 필요한 준비다. 일본 재무성은 비거주자의 부동산 취득 신고에 관한 별도 FAQ를 제공한다. 현재 안내를 기준으로 자신의 취득에 어떤 절차가 적용되는지 확인하고 필요한 전문가의 도움을 받는다. 소유권 등기와 신고 관련 확인은 각각 준비해야 한다.",
            "마지막으로 집을 넘겨받은 날부터 어떻게 관리할지 정한다. 수리와 공공서비스 개통, 관리 담당자와의 연락 방법을 마련하고 해외에 있는 기간의 대응도 포함한다. 나카메구로와 기요스미시라카와, 카구라자카에서 고른 집이 오래 쓸 도쿄의 거점이 되려면 자금과 건물의 의무, 실제 생활에 대한 계획이 함께 갖춰져야 한다."
          ]
        },
        "links": [
          {
            "href": "https://www.mof.go.jp/english/policy/international_policy/real_property/faq.pdf",
            "label": {
              "en": "Read the Ministry of Finance acquisition-reporting FAQ",
              "ko": "일본 재무성 취득 신고 안내 읽기"
            }
          }
        ]
      }
    ],
    "sources": [
      {
        "title": "GO TOKYO · Nakameguro, Meguro River and rail access",
        "href": "https://www.gotokyo.org/en/destinations/southern-tokyo/nakameguro/index.html"
      },
      {
        "title": "GO TOKYO · Kiyosumi Shirakawa, gardens, art and rail access",
        "href": "https://www.gotokyo.org/en/destinations/eastern-tokyo/kiyosumi-shirakawa/index.html"
      },
      {
        "title": "GO TOKYO · Kagurazaka and station approaches",
        "href": "https://www.gotokyo.org/en/destinations/central-tokyo/kagurazaka/index.html"
      },
      {
        "title": "Tokyo Star Bank · Star Mortgage eligibility and property use",
        "href": "https://www.tokyostarbank.co.jp/foreign/en/products/loan/homeloan_star/"
      },
      {
        "title": "Ministry of Finance Japan · Non-resident acquisition-reporting FAQ",
        "href": "https://www.mof.go.jp/english/policy/international_policy/real_property/faq.pdf"
      }
    ]
  }
];
