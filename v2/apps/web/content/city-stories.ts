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
      "ko": "서울숲 가까운 집, 왕십리에서 출퇴근하기 편한 집, 망원시장에서 장보는 일상. 마음이 가는 동네를 출발점 삼아, 내 생활과 예산에 맞는 집을 찾아본다."
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
            "Start with the Seoul you would use every day: Seongsu’s park and workshop streets, Wangsimni’s connections or Mangwon’s market. The discovery story turns that attraction into a housing brief."
          ],
          "ko": [
            "서울숲과 성수의 골목, 왕십리의 교통, 망원의 시장 중 어떤 일상을 원하는가. 도시를 발견하는 글에서 마음이 가는 장소를 실제 주거 조건으로 바꿔본다."
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
            "Would owning improve your life enough to justify the cash committed? Put a comparable jeonse or monthly rental beside the purchase and decide how long you expect to stay."
          ],
          "ko": [
            "집을 소유해 얻을 주거 안정이 묶이는 자금과 비용을 감수할 만큼 큰가. 비슷한 집의 전세·월세와 매수를 비교하고 예상 거주기간부터 정한다."
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
            "Before choosing a price range, establish your purchase route, available cash and confirmed borrowing. The eligibility article separates the property price from the money needed to complete."
          ],
          "ko": [
            "가격대를 고르기 전에 매수 자격, 쓸 수 있는 현금과 확인된 대출을 정리한다. 구매 가능성 글에서는 집값과 잔금일까지 필요한 돈을 구분한다."
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
          "ko": "성수, 왕십리, 망원에서 달라지는 선택"
        },
        "paragraphs": {
          "en": [
            "Begin with Seongsu, Wangsimni and Mangwon as three different search directions. Open the neighbourhood guides, then compare candidate homes within your commute and budget."
          ],
          "ko": [
            "성수·왕십리·망원을 서로 다른 탐색의 출발점으로 삼는다. 동네별 글을 읽은 뒤 출퇴근 조건과 예산 안에서 실제 후보를 좁힌다."
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
            "A district price cannot settle the value of one apartment. Read its building identity, exclusive floor area, contract dates and recurring costs before choosing which transactions belong in the comparison."
          ],
          "ko": [
            "자치구 가격만으로 한 채의 값을 정할 수는 없다. 건물과 전용면적, 계약일, 유지비를 확인하고 비교에 넣을 거래를 고른다."
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
            "Turn a preferred home into a completion timetable: financing, title checks, contract conditions, payment and registration. The purchase guide explains which tasks must be settled before money moves."
          ],
          "ko": [
            "마음에 드는 집을 찾았다면 대출, 권리 확인, 계약 조건, 지급과 등기의 순서를 잡는다. 돈을 보내기 전에 끝내야 할 일을 구매 절차에서 확인한다."
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
            "A waterfront address, a mature estate and an MRT-centred neighbourhood offer different routines. Start with where work, school and ordinary errands would take you."
          ],
          "ko": [
            "수변 주거지, 생활시설이 자리 잡은 주택가, MRT 중심 동네는 하루의 동선이 다르다. 직장·학교·장보는 곳을 중심으로 살고 싶은 모습을 그려본다."
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
            "The reason to own depends on both your plans and your buyer profile. Weigh housing stability against acquisition duties, tied-up cash and the flexibility of renting."
          ],
          "ko": [
            "같은 집이라도 구매자 신분과 거주 계획에 따라 소유의 의미가 달라진다. 주거 안정과 취득세, 묶이는 자금, 임차의 유연성을 함께 따져본다."
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
            "HDB and private homes have different entry conditions. Establish the household’s eligibility and applicable stamp duties before treating a listing price as an affordable budget."
          ],
          "ko": [
            "HDB와 민간 주택은 구매 조건이 다르다. 가구의 자격과 적용 인지세를 확인한 뒤 매물 가격이 실제 예산 안에 들어오는지 판단한다."
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
            "Use CCR, RCR and OCR to organise the search, then narrow it by station, tenure, space and price. A regional label alone does not make two projects comparable."
          ],
          "ko": [
            "CCR·RCR·OCR로 큰 범위를 잡은 뒤 역, 보유권 형태, 면적과 가격으로 좁힌다. 같은 권역이라는 이유만으로 두 프로젝트를 바로 비교하지 않는다."
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
            "Separate the premium for a new launch from the space, remaining tenure and maintenance obligations you receive. Compare actual units before deciding what the extra price buys."
          ],
          "ko": [
            "신규 분양에 더 내는 가격과 그 대가로 얻는 면적, 잔여 보유기간, 유지관리 조건을 나누어 본다. 실제 주택끼리 비교해야 추가 금액의 의미가 드러난다."
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
            "Align the option or contract deadline with loan approval, stamp duty and completion funds. Keep the HDB and private-home procedures separate throughout the timetable."
          ],
          "ko": [
            "옵션·계약 기한에 맞춰 대출 승인, 인지세와 잔금을 준비한다. HDB와 민간 주택의 절차를 구분해 지급 일정을 정리한다."
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
            "Marina’s waterfront, JLT’s lakeside streets and Downtown’s central destinations suggest different ways to live. Begin with the places your normal week would actually use."
          ],
          "ko": [
            "마리나의 수변, JLT의 호숫가, 다운타운의 도심 생활은 서로 다른 일상을 만든다. 평소 한 주 동안 자주 오갈 장소에서 탐색을 시작한다."
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
            "Separate buying a home to use from buying rental income. Your holding period, vacancy exposure and recurring building bill change whether ownership serves the plan."
          ],
          "ko": [
            "직접 살 집과 임대수입을 얻을 집은 구매 이유부터 다르다. 보유기간, 공실과 건물 운영비를 함께 놓고 소유가 내 계획에 맞는지 따져본다."
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
            "Check the ownership route for the exact property, then separate its price from transfer costs and the cash needed at each payment date. Residence and borrowing are additional questions."
          ],
          "ko": [
            "해당 부동산의 취득 경로를 확인한 뒤 집값, 이전 비용과 지급일별 현금을 나눈다. 거주 자격과 대출은 별도로 확인한다."
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
            "Choose the daily destinations and housing type before comparing communities. The area-selection guide helps turn Marina, JLT and Downtown into a shortlist with a consistent brief."
          ],
          "ko": [
            "주요 생활 동선과 주택 유형을 먼저 정하고 지역을 비교한다. 지역 선택 글에서 마리나·JLT·다운타운을 같은 주거 조건 아래 검토한다."
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
            "A completed apartment and an off-plan contract offer different evidence. Inspect the ready home’s title, occupancy and charges; examine the off-plan project’s registration and delivery obligations."
          ],
          "ko": [
            "준공 주택과 분양 계약은 확인할 자료가 다르다. 준공 주택은 권리·점유·관리비를, 분양은 프로젝트 등록과 인도 조건을 중심으로 살핀다."
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
            "Put the contract conditions, itemised costs, approvals and registration into one payment schedule. Keep an off-plan instalment and delivery timetable distinct from a completed-property transfer."
          ],
          "ko": [
            "계약 조건, 항목별 비용, 필요한 승인과 등기를 하나의 지급 일정으로 정리한다. 분양의 중도금·인도 일정은 준공 주택 이전 절차와 구분한다."
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
            "Tokyo is a choice of station areas and daily routes, not one uniform market. Start with the neighbourhood routine you want before choosing a ward or building."
          ],
          "ko": [
            "도쿄의 주거 선택은 구 이름보다 역 주변과 생활 동선에서 구체화된다. 어떤 하루를 보내고 싶은지부터 정한 뒤 지역과 건물을 고른다."
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
            "How long would the home remain useful if work or household needs changed? Compare ownership with renting over that period, including acquisition costs and shared-building obligations."
          ],
          "ko": [
            "직장이나 가족 구성이 바뀌어도 얼마나 오래 쓸 집인가. 그 기간의 임차와 매수를 비교할 때 취득 비용과 공동 건물의 부담도 포함한다."
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
            "Ownership, residence status and a mortgage are separate decisions. Establish the funds and documents available to you before relying on a financing assumption in the search."
          ],
          "ko": [
            "주택 소유, 체류 자격과 주택담보대출은 별개의 문제다. 대출을 전제로 매물을 찾기 전에 준비 가능한 자금과 서류부터 정리한다."
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
            "Choose station access, usable space and building age before comparing prices. The area guide explains how to narrow the search without treating an entire ward as one price band."
          ],
          "ko": [
            "역 접근성, 필요한 면적과 건물 연식을 정한 뒤 가격을 비교한다. 한 구 전체를 같은 가격대로 보지 않고 후보를 좁히는 방법을 살펴본다."
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
            "A renovated interior does not show how the shared building is funded. Read the repair plan, accounts and approved payments, then compare the ten-year cash needs of the shortlisted homes."
          ],
          "ko": [
            "리모델링한 실내만으로 공동 건물의 재정을 알 수는 없다. 장기수선계획, 결산과 의결된 납부액을 읽고 후보 주택의 10년 지출을 비교한다."
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
            "Coordinate the broker’s explanations, contract conditions, financing and settlement documents before committing to dates. Record who provides each missing document and when funds must arrive."
          ],
          "ko": [
            "중개사의 설명, 계약 조건, 대출과 잔금 서류를 맞춘 뒤 일정을 확정한다. 빠진 서류를 누가 언제 제공하는지, 자금은 언제 도착해야 하는지 정리한다."
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
