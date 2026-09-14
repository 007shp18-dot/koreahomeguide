import type { NeighbourhoodStory } from '../neighbourhood-stories';

type Copy = Pick<NeighbourhoodStory, 'title' | 'deck' | 'intro' | 'living'> & {
  sections: readonly (readonly [title: string, ...paragraphs: string[]])[];
};
const editions: Readonly<Record<string, Readonly<Record<'en' | 'ko', Copy>>>> = {
  'yeonhui-dong': {
    ko: {
      title: '연희동, 점심 골목에서 주택가로 한 블록',
      deck: '연희맛길에서 식사하고 담장 너머의 낮은 지붕을 따라 걷는다. 박물관은 오후의 선택지다.',
      intro: '연희동에서는 식당이 모인 길과 주택가가 멀리 떨어져 있지 않다. 연희로와 연희맛길을 출발점으로 삼으면 점심 한 끼와 작은 골목 산책을 묶을 수 있다. 유명한 가게를 여러 곳 잇기보다 큰길에서 안쪽으로 들어갈 때 무엇이 달라지는지 보는 동선이다.',
      sections: [
        ['식당가에서 길을 하나 바꾸면', '연희맛길에서 식사 장소를 정한 뒤 가까운 공공 골목으로 들어가 보자. 낮은 지붕과 담장, 집 사이의 간격이 큰길의 상점 앞과 다른 풍경을 만든다. 다만 주택의 대문 안쪽은 관람 공간이 아니다.', '같은 연희동 주소여도 언덕 위와 큰길 가까운 집의 이동 조건은 다르다. 산책에서는 작은 오르막이지만 장을 보고 돌아올 때는 매번 지나야 할 길이다. 다음 카페를 찾는 사이에 경사와 버스 정류장의 위치도 볼 수 있다.'],
        ['커피를 마신 뒤에는 같은 길로 돌아가도 된다', '카페 하나를 쉼터로 두면 동선을 더 늘릴 필요가 없다. 창가에서 보인 골목을 돌아 나가거나 식당가로 되돌아오는 정도면 된다. 매장의 영업 여부와 자리는 방문하는 날 확인해야 한다.', '이 글의 사진에는 서로 다른 해의 연희동이 담겨 있다. 사진 속 가게가 지금도 같은 모습으로 영업한다고 전제하지 않았다. 건물과 길의 관계를 참고하되, 쉬어 갈 장소는 당일의 거리에서 고를 수 있다.'],
        ['박물관을 넣을지 정하는 갈림길', '서대문자연사박물관은 식사와 산책에 다른 주제를 더할 수 있는 곳이다. 지구 환경과 생명의 변화, 인간과 자연을 다루는 전시가 있어 아이와 함께라면 오후의 중심을 이쪽에 둘 수도 있다. 관람 일정은 박물관의 현재 안내를 확인하자.', '박물관을 빼면 주택가에서 큰길로 돌아오는 짧은 산책이 남는다. 연희동 전체를 한 번에 볼 필요는 없다. 마음에 든 골목과 실제 돌아갈 정류장을 연결해 두면 다음 방문의 길도 정해진다.'],
      ],
      living: '집을 찾고 있다면 그 주소에서 실제로 탈 정류장까지 걸어 보자. 지도에 가까운 역보다 버스가 편할 수도 있고, 마지막 경사 때문에 같은 거리도 다르게 느껴질 수 있다. 저녁 조명과 장을 볼 곳까지 확인한 뒤 집의 면적·상태와 함께 비교할 일이다.',
    },
    en: {
      title: 'Yeonhui-dong, one turn beyond the lunch streets',
      deck: 'Begin around Yeonhui Mat-gil, then follow the low roofs into the residential lanes. The museum is an optional afternoon anchor.',
      intro: 'Yeonhui-dong keeps its restaurant streets and residential lanes close together. Starting around Yeonhui-ro and Yeonhui Mat-gil makes lunch and a modest walk fit without a long list of venues. The route follows what changes when a visitor turns away from the main street.',
      sections: [
        ['Turn off the restaurant street', 'After choosing lunch, enter a nearby public lane. Low rooflines, walls and the gaps between homes change the view from the shopfronts. Residential gates are not visitor entrances.', 'Addresses on the hill and close to the main road can involve different journeys. A small incline during an afternoon walk becomes a repeated trip when carrying groceries. The route to the next stop can also reveal gradients and the useful bus stop.'],
        ['Let the break keep the route small', 'One café can serve as a pause without expanding the itinerary. Return through the lane seen from its window or back toward lunch. Opening and available seating need checking on the day.', 'The photographs record different years, not a promise that the pictured businesses remain unchanged. Use them for the relationship between buildings and streets, while choosing the actual stopping place from current conditions.'],
        ['The museum or the shorter return', 'Seodaemun Museum of Natural History offers another subject after lunch: Earth’s environment, changing life and the relationship between people and nature. For a family outing it can become the main afternoon stop. Check current admission arrangements.', 'Without the museum, the residential lanes lead back to a shorter outing. There is no requirement to cover all of Yeonhui-dong. Connecting a favoured street to the actual return bus stop is enough to leave with a route worth repeating.'],
      ],
      living: 'For a housing search, walk from the exact address to the transport stop you would use. A bus may be more useful than the nearest rail pin, and a final incline can change the experience of a short distance. Evening lighting and groceries belong beside area and building condition in the comparison.',
    },
  },
  'joo-chiat-katong': {
    ko: {
      title: '주치앗·카통, 파스텔색 집들 다음의 골목',
      deck: '쿤셍 로드의 외관에서 식사와 주치앗 플레이스까지. 사진의 배경을 지나 생활의 길을 잇는다.',
      intro: '쿤셍 로드의 나란한 창과 장식적인 외관은 이 산책의 출발점이다. 하지만 같은 집 앞에서 사진을 찍고 돌아서면 주치앗과 카통의 큰 부분을 놓친다. 주치앗 로드 쪽의 식사와 옆길을 이어야 건물이 거리와 함께 보인다.',
      sections: [
        ['창문보다 먼저 비워 둘 문 앞', '쿤셍 로드에서는 공공 거리에서 외관을 볼 수 있다. 비슷한 높이와 창의 배열 안에서도 색과 장식은 집마다 다르다. 대문과 출입 공간은 사진 구도를 위해 차지하지 말자.', '주거 건물의 모습과 내부를 방문할 수 있는지는 다른 문제다. 외관을 본 다음에는 주치앗 로드로 동선을 옮기면 된다. 한 줄의 집이 동네 전체를 대표하지는 않는다.'],
        ['점심이 건물 이야기와 만나는 곳', '카통의 음식 문화는 페라나칸의 역사와 연결돼 있다. 락사를 한 끼의 선택지로 두면 외관에서 시작한 관심이 식탁으로 이어진다. 특정 가게를 정했다면 그날의 영업을 확인하자.', '식사 뒤의 길은 날씨에 맞춰 짧게 조절할 수 있다. 비를 피할 수 있는 구간과 큰길을 건너는 곳은 지도의 직선거리와 다른 이동 시간을 만든다.'],
        ['주치앗 플레이스로 돌아서기', '주치앗 플레이스 쪽에서는 길게 이어지는 숍하우스와 위층의 창을 볼 수 있다. 앞서 본 유명한 외관뿐 아니라 출입구와 자전거, 물건을 들이는 공간까지 시야를 넓힐 구간이다.', '카페를 더 찾기보다 다음 귀갓길에 쓸 교통편으로 이어 가도 좋다. 식사 장소에서 실제 정류장이나 역 출입구까지 걸어 보면 이 동네를 다시 찾을 때 필요한 거리도 남는다.'],
      ],
      living: '식당가 가까운 집을 본다면 점심과 저녁의 배기·손님 동선이 어떻게 다른지 확인하자. 보기 좋은 숍하우스 외관만으로 주거 용도나 내부 상태를 판단할 수는 없다. 정확한 건물과 비를 피할 수 있는 이동 경로를 확인한 뒤 비교해야 한다.',
    },
    en: {
      title: 'Joo Chiat and Katong, beyond the pastel row',
      deck: 'From Koon Seng Road’s facades to lunch and Joo Chiat Place, connect the photographed houses to the streets around them.',
      intro: 'The repeated windows and decorative fronts of Koon Seng Road make an obvious beginning. Leaving after the photograph would miss much of Joo Chiat and Katong. Lunch toward Joo Chiat Road and a return through the side streets give those buildings a wider setting.',
      sections: [
        ['Leave the doors clear', 'View the Koon Seng Road houses from the public street. Colour and ornament vary within their repeated height and window patterns. Keep gates and entrances available to the people using them.', 'An interesting residential facade does not establish visitor access inside. After looking, continue toward Joo Chiat Road. One well-photographed row cannot represent the whole district.'],
        ['Lunch carries another part of the history', 'Katong’s food culture connects the walk to Peranakan heritage. Laksa is one possible meal that takes the subject from buildings to the table. Confirm opening if choosing a particular business.', 'The next leg can be shortened for weather. Covered stretches and road crossings change a journey that looks simple as a straight line on a map.'],
        ['Turn along Joo Chiat Place', 'Long shophouse rows and upper-floor shutters widen the view beyond the celebrated facades. Look at entrances, bicycles and delivery space as well as ornament.', 'Instead of adding another café, connect the meal to the actual transport stop for the return. The walk to the useful entrance leaves a practical distance to remember for another visit.'],
      ],
      living: 'For a home near restaurants, compare lunch and evening ventilation and customer activity. An attractive shophouse front does not establish approved residential use or interior condition. Locate the exact building and weather-appropriate daily route before comparing homes.',
    },
  },
  'alserkal-al-quoz': {
    ko: {
      title: '알세르칼, 전시 한 곳과 영화 한 편 사이',
      deck: '알쿠오즈의 창고 구역에서 갤러리와 식사, 시네마 아킬을 잇는다. 상영 시간이 하루의 길이를 정한다.',
      intro: '알세르칼 애비뉴에서는 창고 건물의 큰 문이 전시장과 카페, 영화관의 입구가 된다. 넓은 두바이에서 여러 지구를 넘나드는 대신 한 구역 안에 머무를 수 있는 동선이다. 보고 싶은 전시나 영화 하나를 먼저 고르면 나머지 시간은 그 사이에 놓인다.',
      sections: [
        ['전시가 있는 날을 고르기', '알세르칼의 프로그램과 입주 공간 안내에서 방문할 갤러리를 고를 수 있다. 더 서드 라인과 카본 12 같은 공간이 있지만, 이름이 지도에 있다는 사실이 원하는 날의 전시를 보장하지는 않는다.', '시간을 확인한 전시 한 곳을 중심으로 잡자. 밖의 밝은 통로와 창고 규모의 실내를 오가는 경험은 짧은 거리 안에서도 달라진다. 모든 문을 들어가야 하는 코스는 아니다.'],
        ['쉬는 시간을 이동 시간으로 쓰지 않기', '커피와 식사는 단지 안의 입주 업체 안내에서 고를 수 있다. 나이트자나 bkry를 생각한다면 현재 영업을 확인하면 된다. 다음 일정과 가까운 곳에서 쉬면 긴 야외 이동을 줄일 수 있다.', '식사 뒤에 전시 하나를 더 볼지, 영화 시간까지 머물지 정할 여유를 남겨 두자. 더운 날에는 지도에서 짧아 보이는 바깥 구간도 같은 속도로 걸을 수 없다.'],
        ['시네마 아킬을 마지막 약속으로', '시네마 아킬의 현재 상영작과 시간을 먼저 확인하면 오후의 끝이 정해진다. 전시와 식사는 그 앞에 놓고, 상영 뒤 돌아갈 교통편을 함께 생각해 두면 된다.', '영화를 보지 않는 날에는 전시와 식사만으로 동선을 마칠 수 있다. 이곳에 오래 머무는 것보다 보고 싶은 프로그램이 있는 날 찾아오는 편이 방문의 이유를 분명하게 만든다.'],
      ],
      living: '알세르칼 애비뉴는 주거 단지가 아니라 알쿠오즈의 문화 공간이다. 가까이 살고 싶다면 후보 주택에서 실제로 오가는 시간과 비용을 비교해야 한다. 늦은 상영 뒤에도 같은 이동이 가능한지 확인해야 주말 목적지가 일상의 선택지가 된다.',
    },
    en: {
      title: 'Alserkal, between an exhibition and a film',
      deck: 'Keep the outing inside Al Quoz’s warehouse arts district, with a screening setting the pace.',
      intro: 'At Alserkal Avenue, large warehouse doors lead into galleries, cafés and a cinema. One district can hold the outing instead of a succession of cross-city journeys. Choose the exhibition or film first and arrange the remaining hours around it.',
      sections: [
        ['Choose a day with something to see', 'The programme and community directory identify spaces including The Third Line and Carbon 12. A gallery’s presence on a map does not guarantee an exhibition on the intended date.', 'Anchor the visit with one confirmed programme. Moving between a bright outdoor lane and a warehouse-scale interior already changes the experience over a short distance. There is no need to enter every doorway.'],
        ['Keep the break nearby', 'Use the community directory to choose food or coffee, checking current opening for places such as Nightjar or bkry. Staying near the next appointment limits the outdoor transfer.', 'Leave the decision about another exhibition until after the break. In hot conditions, even a short-looking outdoor leg may not work at the pace suggested by a map.'],
        ['Let Cinema Akil set the finish', 'Check the current film and screening time, then place the gallery and meal before it. Plan the return transport alongside the booking rather than after the credits.', 'Without a film, the exhibition and meal can complete the route. Visiting for a programme that interests you gives the day a clearer purpose than staying merely to fill the afternoon.'],
      ],
      living: 'Alserkal Avenue is a cultural destination, not a residential development. Compare the actual journey and cost from shortlisted homes. The late-screening return matters if proximity is supposed to make the district part of ordinary life.',
    },
  },
  'kichijoji': {
    ko: {
      title: '기치조지, 역 남쪽의 연못과 북쪽의 저녁',
      deck: '이노카시라공원에서 시작해 상점가와 하모니카 골목으로 돌아온다. 역을 사이에 두고 길의 규모가 바뀐다.',
      intro: '기치조지역 남쪽에는 이노카시라공원, 북쪽에는 상점가와 하모니카 골목이 있다. 하루의 전반을 연못 주변에서 보내고 역을 건너 식사 쪽으로 이동할 수 있는 배치다. 멀리 떨어진 명소를 잇지 않아도 열린 공원과 좁은 골목을 함께 볼 수 있다.',
      sections: [
        ['연못을 돌아 출발점으로', '이노카시라공원에서는 연못과 벤텐 신사 쪽 길을 중심으로 돌 수 있다. 보트를 넣을지는 그날 운영과 날씨를 보고 결정하면 된다. 물가를 따라 걷는 것만으로도 첫 구간이 만들어진다.', '어느 입구로 되돌아갈지 정해 두면 공원 산책 뒤의 이동이 쉬워진다. 공원이 가까운 집을 찾는 경우에도 지도상의 경계보다 실제 출입구까지의 길이 중요하다.'],
        ['역을 건너 상점가로', '선로드와 다이야가이는 공원의 넓은 길과 다른 밀도의 상업 공간이다. 식사와 쇼핑을 한 번에 해결하려면 북쪽 구간을 묶는 편이 자연스럽다. 양쪽 상점가를 모두 끝까지 걸을 필요는 없다.', '사람과 가게가 모인 역 주변은 생활의 편리함을 주지만, 역 반대편으로 이동할 때마다 통과해야 하는 구간이기도 하다. 공원과 상점가 사이에서 실제로 어느 길을 쓰게 되는지 볼 수 있다.'],
        ['하모니카 골목의 작은 식당들', '역 북쪽 하모니카 골목은 전후 시장에서 시작된 좁은 길의 집합이다. 공원에서 출발한 산책의 마지막을 작은 음식점 쪽으로 바꿀 수 있다. 좌석이 적은 곳이 있으니 특정 한 곳만 가능한 계획은 피하는 편이 편하다.', '마지막 식사 뒤에는 큰길로 나와 역으로 돌아간다. 연못에서 골목까지 가까운 거리에 서로 다른 공간이 있다는 점이 이 동선의 장점이다. 둘 중 어느 쪽을 더 자주 찾을지는 직접 걸으며 정할 수 있다.'],
      ],
      living: '집 후보는 역 양쪽에서 비교해 보자. 공원에 가는 길과 출근할 승강장으로 가는 길이 모두 짧은지는 주소마다 다르다. 쇼핑객이 많은 시간의 통과 동선과 집 앞의 소리는 별도로 확인할 조건이다.',
    },
    en: {
      title: 'Kichijoji: the pond south of the station, dinner to the north',
      deck: 'Walk Inokashira Park before crossing to the shopping streets and Harmonica Alley.',
      intro: 'Inokashira Park lies south of Kichijoji Station; shopping streets and Harmonica Alley lie north. That arrangement can carry a day from the pond to dinner without joining distant attractions. Open park paths and compact lanes sit on opposite sides of the same transport hub.',
      sections: [
        ['Make a circuit of the pond', 'The pond and paths toward the Benten shrine provide the first part of the route. Decide about boating from the day’s operation and weather; a waterside walk does not require an extra activity.', 'Choose the return entrance before leaving the park. For a nearby housing search, the actual park access matters more than distance to its boundary on a map.'],
        ['Cross into the shopping streets', 'Sun Road and Daiyagai offer a denser commercial setting after the park. Shopping and a meal fit together on the north side without covering the full length of both streets.', 'The station area supplies convenience, but is also a section to pass through when travelling between the two sides. Notice which route would connect the places you would use most often.'],
        ['Find dinner in the smaller lanes', 'Harmonica Alley developed from a postwar market. Its narrow lanes and small eating places give the route a different finish from the pond. Limited seating makes flexibility more useful than depending on one room.', 'After eating, step back onto the broader streets toward the station. The appeal of this circuit is the proximity of very different spaces; the walk can reveal which side you would return to more often.'],
      ],
      living: 'Compare homes on both sides of the station. The park route and the journey to the required platform will not be equally short from every address. Busy shopping-hour crossings and the noise at the actual front door need separate attention.',
    },
  },
  'seochon': {
    ko: {
      title: '서촌, 궁궐 서쪽의 집과 시장 사이',
      deck: '통의동·누하동 골목에서 통인시장과 대오서점으로. 한옥을 전시물이 아닌 거리의 일부로 보는 길.',
      intro: '서촌은 하나의 명소 이름이 아니라 경복궁 서쪽에 이어진 동네다. 기와지붕 옆에 벽돌집과 작은 가게가 붙어 있고, 그 사이 길이 통인시장으로 이어진다. 경복궁역에서 출발해 점심을 먹고 대오서점 쪽으로 돌아오는 정도로 동선을 잡을 수 있다.',
      sections: [
        ['통의동에서 누하동으로', '궁궐 서쪽 골목에서는 한옥만 찾아 걷기보다 서로 다른 건물이 붙어 있는 모습을 볼 수 있다. 처마와 담장, 가게 창이 가까운 길을 함께 쓴다. 열려 있는 대문이 관람을 허용한다는 뜻은 아니다.', '공공 골목을 따라가며 주민 출입구를 비워 두자. 이 글의 사진은 2014~2016년 기록이다. 건물의 이력을 보여 주는 자료이지 사진 속 영업점이 지금도 같다는 안내는 아니다.'],
        ['통인시장에서 점심을 정하기', '통인시장의 도시락 프로그램은 참여 점포의 음식을 골라 한 끼로 묶는 방식이다. 이를 이용하려면 현재 운영 시간과 참여 안내를 확인해야 한다. 식사는 지정된 공간을 이용하면 된다.', '시장에는 방문객의 점심 외에 동네 장보기도 이어진다. 작은 통로에서 음식이나 사진을 고를 때는 물건을 나르는 사람과 다른 손님이 지나갈 자리를 남겨 두자.'],
        ['대오서점 앞에서 돌아오는 길', '대오서점의 간판과 기와지붕은 골목에서 알아볼 만한 표지다. 여기의 사진은 2015년 모습을 담았다. 안으로 들어갈 계획이라면 현재 운영과 입장 조건을 별도로 확인해야 한다.', '더 걷고 싶은 날에는 옥인동 너머 수성동계곡을 선택할 수 있지만 이번 길의 필수 구간은 아니다. 시장과 집 사이를 돌아 경복궁역으로 향하는 짧은 귀환도 남겨 둘 수 있다.'],
      ],
      living: '골목이 마음에 든다면 후보 집에서 경복궁역까지 출근 시간에 걸어 보자. 언덕과 배달·주차 접근, 오래된 건물의 수선 상태는 사진의 분위기와 별개의 조건이다. 집을 고를 때는 그 출입구까지의 길을 기준으로 삼아야 한다.',
    },
    en: {
      title: 'Seochon, between the houses and the market',
      deck: 'Walk Tongui-dong and Nuha-dong toward Tongin Market and Dae-o Bookstore, keeping the hanok inside their everyday street setting.',
      intro: 'Seochon names a neighbourhood west of Gyeongbokgung, not one attraction. Tiled roofs sit beside brick homes and small shops on lanes leading toward Tongin Market. A route from Gyeongbokgung Station through lunch and back by Dae-o Bookstore keeps the outing close to those streets.',
      sections: [
        ['Tongui-dong to Nuha-dong', 'Look at different buildings sharing the lanes rather than searching only for hanok. Eaves, walls and shop windows occupy the same close street. An open residential gate does not grant visitor access.', 'Stay on public lanes and leave entrances clear. The photographs date from 2014–2016: records of buildings, not confirmation that pictured businesses remain unchanged.'],
        ['Choose lunch at Tongin Market', 'The market’s dosirak programme lets visitors combine food from participating stalls. Check its current operation and use the designated eating space.', 'Ordinary shopping continues alongside the visitor lunch route. Leave the narrow passage available to other customers and people moving goods while choosing food or taking photographs.'],
        ['Return by Dae-o Bookstore', 'The sign and tiled roof mark Dae-o Bookstore from the lane. The photograph records its 2015 appearance; current entry and opening conditions require a separate check.', 'Suseongdong Valley beyond Ogin-dong is an optional extension, not a required leg. A shorter return between the homes and market toward the station remains a complete route.'],
      ],
      living: 'If a lane appeals as an address, walk from the actual home to Gyeongbokgung Station at commuting time. Gradients, delivery and parking access, and older-building repairs are separate from the photographic atmosphere. Use the exact entrance as the start of the comparison.',
    },
  },
  'tiong-bahru': {
    ko: {
      title: '티옹바루, 시장 위층에서 낮은 주택가로',
      deck: '호커센터에서 시작해 엥훈 스트리트와 용시악 스트리트를 걷는다. 보존된 외관 뒤의 계단도 함께 본다.',
      intro: '티옹바루의 곡선형 발코니와 낮은 주거 블록은 싱가포르 초기 공공주택의 모습을 남긴다. 시장에서 한 끼를 먹고 주변 거리를 도는 동선이면 건축과 일상의 쓰임을 함께 볼 수 있다. 카페만 찾아왔을 때와는 출발점이 달라진다.',
      sections: [
        ['시장 위층과 아래층', '셍포 로드의 티옹바루 마켓은 아래층의 시장과 위층의 호커센터를 묶는다. 식사하고 나서 식재료를 파는 층을 한 바퀴 도는 식으로 동선을 잡을 수 있다. 원하는 점포의 운영은 방문 당일 확인해야 한다.', '일정한 시간에 어떤 사람이 모인다고 단정하지 않아도 두 층의 쓰임은 다르다. 여행 중 한 끼를 해결하는 공간이면서 주변 주택의 장보기 장소이기도 하다.'],
        ['엥훈 스트리트에서 보는 건물의 옆면', '엥훈 스트리트와 모관 테라스에서는 둥근 모서리와 수평 띠, 계단 같은 건축 요소를 볼 수 있다. 정면 사진을 찍은 뒤에는 출입구와 뒤편 길이 어떻게 이어지는지도 살펴보자.', '용시악 스트리트로 돌면 작은 상점과 식사 공간을 다음 구간에 넣을 수 있다. 가게는 바뀔 수 있어 오래된 사진의 간판을 현재 추천 목록으로 쓰지는 않았다.'],
        ['78블록의 대피소, 들어갈 수 있는 날에', '관추안 스트리트 78블록 아래의 전쟁 전 민간 방공호는 별도 개방 일정이 있는 장소다. 내부를 보려면 유산 기관의 현재 방문 안내를 확인해야 한다. 닫혀 있으면 주변 건물과 길을 보는 쪽으로 마무리할 수 있다.', '이 구간에서는 주택 정면뿐 아니라 공용 출입과 뒤편 동선을 볼 이유가 생긴다. 티옹바루를 하나의 보존 풍경으로 묶기보다 집들이 실제로 어떻게 이어져 있는지 확인하는 길이다.'],
      ],
      living: '집을 살펴볼 때는 전쟁 전 보존 블록인지 이후 주택인지, 해당 출입구에 엘리베이터가 있는지부터 확인하자. 보유권과 허용 공사, 관리 상태도 주소별로 다르다. 오래된 외관이라는 공통점만으로 가격 프리미엄이나 냉방비를 단정하지 않는다.',
    },
    en: {
      title: 'Tiong Bahru, from the market upstairs to the low blocks',
      deck: 'Begin with a meal, then follow Eng Hoon Street and Yong Siak Street beyond the familiar curved facades.',
      intro: 'Tiong Bahru’s curved balconies and low blocks retain a view of Singapore’s early public housing. Starting at the market makes architecture and everyday use part of the same route, instead of joining only the cafés.',
      sections: [
        ['The market on two levels', 'Tiong Bahru Market on Seng Poh Road combines a market below with a hawker centre above. A meal followed by the produce floor gives the first leg a straightforward shape. Check the intended stalls on the day.', 'The two levels have different uses without needing a claim about who appears at a particular hour. They serve both a visitor’s meal and shopping for nearby homes.'],
        ['Look around the side of the buildings', 'Eng Hoon Street and Moh Guan Terrace expose curved corners, horizontal bands and stairs. After the frontal view, look at how entrances connect with the back lanes.', 'Turning toward Yong Siak Street brings shops and food into the next leg. Businesses can change; signs in an old photograph are not treated as a current recommendation list.'],
        ['The shelter beneath Block 78', 'The pre-war civilian air-raid shelter under Block 78 on Guan Chuan Street has separate access arrangements. Check current heritage-visit information if the interior matters. When closed, the building and surrounding lanes can finish the circuit.', 'This detour gives a reason to look beyond the facades toward shared access and service routes. The homes are connected buildings, not simply one conserved view.'],
      ],
      living: 'For an actual home, establish whether it is in the pre-war conserved section or later housing, and whether its entrance has lift access. Tenure, permitted works and condition are address-specific. An old facade alone does not establish a price premium or a cooling bill.',
    },
  },
  'al-satwa': {
    ko: {
      title: '알사트와에서 주메이라로, 상점 앞길이 넓어질 때',
      deck: '12월 2일 거리의 재단소에서 모스크와 에티하드 박물관 쪽으로. 이동 수단은 날씨와 거리에 맞춰 고른다.',
      intro: '알사트와에서는 재단소와 음식점 같은 길가 영업이 두바이의 고층 풍경과 다른 장면을 만든다. 12월 2일 거리에서 시작해 주메이라 쪽으로 이동하면 거리 폭과 건물 배치도 달라진다. 전 구간을 반드시 걸어야 하는 코스는 아니다.',
      sections: [
        ['12월 2일 거리에서 시작하기', '옛 디야파 거리로도 알려진 길 주변에는 의류와 직물, 재단을 다루는 상점이 있다. 구경하고 싶다면 영업 중인 가게에서 허락을 구하면 된다. 모든 작업이 현장에서 이뤄진다거나 가격이 동일한 방식으로 정해진다고 전제하지 않는다.', '식사는 이 구간에서 묶을 수 있다. 파키스탄 음식을 찾는다면 실제 메뉴와 운영을 보고 고르자. 오래된 명성이나 사진이 오늘의 대기 시간과 영업을 보장해 주지는 않는다.'],
        ['주메이라 모스크로 이동하기', '주메이라 모스크에는 비무슬림 방문객도 참여할 수 있는 안내 프로그램이 있다. 날짜와 시간, 복장 규정을 공식 안내에서 확인한 뒤 이동하면 된다.', '알사트와에서의 이동은 출발점과 횡단 경로, 더위에 따라 달라진다. 일률적인 도보 시간을 정해 두지 않았다. 넓은 도로를 지나야 하는 구간은 대중교통이나 차량 이동을 함께 고려할 수 있다.'],
        ['에티하드 박물관의 다른 시간', '에티하드 박물관은 1971년 UAE 결성과 연결된 유니언 하우스 곁에 있다. 상점가에서 시작한 관심을 국가 형성의 역사로 옮기는 마지막 목적지가 될 수 있다.', '관람 시간은 박물관의 현재 안내를 확인하자. 식사나 귀환을 위해 알사트와로 돌아온다면 이동 조건도 다시 판단하면 된다. 출발할 때와 같은 길을 같은 속도로 걸어야 할 이유는 없다.'],
      ],
      living: '알사트와라는 이름만으로 주메이라보다 얼마나 저렴한지, 외국인이 어느 집을 소유할 수 있는지 단정할 수 없다. 임대는 같은 유형의 등록 계약과 실제 비용을, 매수는 해당 필지의 권리와 자격을 확인해야 한다. 낮은 거리의 매력과 집의 조건은 나눠 비교하자.',
    },
    en: {
      title: 'Al Satwa to Jumeirah, where the shopfront street widens',
      deck: 'Begin with the tailors around 2nd December Street, then connect to the mosque and Etihad Museum as weather and access allow.',
      intro: 'Street-facing tailoring and food businesses give Al Satwa a different setting from Dubai’s tower districts. Moving from 2nd December Street toward Jumeirah changes road width and building arrangement too. This need not be an all-walking itinerary.',
      sections: [
        ['Start around 2nd December Street', 'The street formerly known as Diyafah and its nearby lanes include clothing, fabric and tailoring businesses. Ask before browsing a working interior. Do not assume every item is made on site or every shop prices its work in the same way.', 'Keep lunch in this part of the route if convenient. For Pakistani food, choose from current menus and openings. An established name or an old photograph cannot guarantee today’s queue or service.'],
        ['Continue to Jumeirah Mosque', 'Jumeirah Mosque offers a guided visitor programme open to non-Muslims. Confirm its current day, time and dress requirements before making the journey.', 'The transfer depends on the starting point, crossings and heat. No universal walking time is assumed. Consider public or vehicle transport where broad-road sections make walking less suitable.'],
        ['Another history at Etihad Museum', 'Etihad Museum stands beside Union House, connected to the UAE’s formation in 1971. It can take an outing begun among shops into the history of the federation.', 'Check current museum admission times. If returning to Satwa for food or transport, reassess the journey; the route does not need to be walked at the same pace in both directions.'],
      ],
      living: 'The Satwa name cannot establish a rental discount against Jumeirah or foreign ownership eligibility for an individual home. Compare equivalent registered leases and costs for renting, or the specific plot’s rights and eligibility for purchase. The appeal of the street and the terms of the home need separate checks.',
    },
  },
  'yanaka': {
    ko: {
      title: '야나카, 상점가를 벗어나 사찰과 집 사이로',
      deck: '닛포리에서 야나카긴자로 내려간 뒤 묘지와 네즈 쪽 길을 잇는다. 오래된 건물과 현재의 쓰임을 함께 본다.',
      intro: '닛포리역에서 야나카긴자 쪽으로 내려가는 길은 짧은 상점가에서 시작한다. 그 뒤로 사찰과 주택, 야나카 묘지의 길이 이어진다. ‘옛 도쿄’라는 이름을 확인하는 여행보다 서로 다른 용도의 공간이 가까이 놓인 동네를 걷는 코스다.',
      sections: [
        ['유야케단단 아래의 상점가', '닛포리 쪽에서 유야케단단 계단을 내려가면 야나카긴자가 이어진다. 간식이나 차를 고를 수 있는 상점가를 먼저 보고 옆길로 돌아 나갈 수 있다. 해 질 무렵의 풍경은 날씨와 계절에 따라 달라진다.', '짧은 거리라고 해서 주거 골목까지 상업 공간은 아니다. 음식을 먹을 장소와 쓰레기 처리는 가게의 안내를 따르고, 집 앞에 머무를 때는 주민 출입을 방해하지 않도록 하자.'],
        ['묘지의 길과 조각가의 집', '야나카 묘지에서는 지정된 길을 따라갈 수 있다. 나무가 있는 통로를 산책하더라도 추모와 관리가 이뤄지는 장소라는 점은 변하지 않는다. 묘역 내부 출입과 사진은 현장 안내를 따라야 한다.', '아사쿠라 조소관은 조각가의 집과 작업실을 볼 수 있는 별도의 목적지다. 내부 관람이 중요하다면 현재 개관일과 이용 조건을 먼저 확인하자. 주말에도 늘 한산하다는 식의 혼잡 보장은 하지 않는다.'],
        ['네즈 쪽으로 길을 늘린다면', '더 걷고 싶다면 분쿄구의 네즈 신사까지 이어 갈 수 있다. 붉은 도리이와 신사 건축은 앞서 본 상점가와 다른 공간이다. 철쭉 개화나 특별 개방을 기대한다면 해당 시기의 공식 안내를 확인해야 한다.', '긴 코스를 원하지 않으면 야나카에서 역으로 되돌아가도 된다. 계단과 좁은 길이 포함되므로 짐이나 보행 조건에 맞춰 실제 이용할 경로를 고르는 편이 좋다.'],
      ],
      living: '야나카의 집을 볼 때는 닛포리나 센다기 중 실제로 이용할 역과 출입구를 먼저 정하자. 건축 연도 하나로 내진 상태나 가격 차이를 확정할 수는 없다. 구조·보강·수선 기록과 길의 접근성을 해당 건물에서 확인해야 하며, 주변 익명 거래를 그 집의 계약으로 읽지 않는다.',
    },
    en: {
      title: 'Yanaka, beyond the shopping street',
      deck: 'Descend from Nippori toward Yanaka Ginza, then connect the temple, cemetery and residential streets, with Nezu as an extension.',
      intro: 'The approach from Nippori begins with a compact shopping street. Beyond it sit temples, homes and the paths of Yanaka Cemetery. This route follows those neighbouring uses rather than asking the area to perform a single idea of “old Tokyo.”',
      sections: [
        ['Below the Yuyake Dandan steps', 'Descending from the Nippori side brings the walk into Yanaka Ginza. Browse food and tea before returning through a side lane. The sunset suggested by the steps’ name depends on season and weather.', 'Nearby residential lanes do not become commercial space because the shopping street is short. Follow shops’ arrangements for eating and waste, and keep household entrances clear.'],
        ['The cemetery and the sculptor’s house', 'Use designated paths in Yanaka Cemetery. A tree-lined walk remains a place of remembrance and maintenance; follow local access and photography guidance around the graves.', 'The Asakura Museum of Sculpture offers a separate visit to the sculptor’s home and studio. If its interior is important, check current opening and admission. No promise of quiet weekend conditions is assumed.'],
        ['Extend toward Nezu if wanted', 'Nezu Shrine in Bunkyo provides a longer route, with red torii and shrine buildings replacing the shopping-street setting. Check the season’s official information before expecting azalea displays or special openings.', 'A shorter return to the station from Yanaka works too. Stairs and narrow paths make the exact route worth choosing for the traveller’s luggage and mobility needs.'],
      ],
      living: 'For a home, identify the useful Nippori or Sendagi entrance first. Construction year alone does not establish earthquake performance or a price premium. Examine the actual structure, strengthening and repair records, and do not treat surrounding anonymous sales as that building’s contracts.',
    },
  },
};

export function reviseNeighbourhood(story: NeighbourhoodStory, locale: 'en' | 'ko'): NeighbourhoodStory {
  const copy = editions[story.slug]?.[locale];
  if (!copy) return story;
  if (copy.sections.length !== story.sections.length) throw new Error(`Neighbourhood section mismatch: ${story.slug}`);
  return { ...story, title: copy.title, deck: copy.deck, intro: copy.intro, living: copy.living, updatedAt: '2026-09-14',
    sections: story.sections.map((section, index) => {
      const [title, ...paragraphs] = copy.sections[index]!;
      return { ...section, title, paragraphs };
    }),
  };
}
