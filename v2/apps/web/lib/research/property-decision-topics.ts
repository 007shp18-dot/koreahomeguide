import type { MarketLocale } from '../locale/market-localization';

export const DECISION_PERSONAS = ['family', 'couple', 'investor'] as const;
export type DecisionPersona = typeof DECISION_PERSONAS[number];
export type DecisionText = Record<MarketLocale, string>;
export const decisionText = (ko: string, en: string, zh: string): DecisionText => ({ ko, en, 'zh-CN': zh });

type Topic = {
  title: DecisionText;
  family: DecisionText;
  couple: DecisionText;
  investor: DecisionText;
  question: DecisionText;
  reversal: DecisionText;
};

/** Editorial lenses, not measurements or an inferred score. Each is paired with
 * a specific review point; the original point and provenance stay on the report. */
export const decisionTopics = {
  school: {
    title: decisionText('학교 배정과 입학', 'School admission', '学区与入学条件'),
    family: decisionText('가까운 학교에 실제로 다닐 수 있어야 이 입지에 더 내는 돈이 의미가 있습니다. 입주 연도와 매물 주소의 배정이 어긋나면 다른 동이나 단지를 먼저 비교하세요.', 'Paying extra for a nearby school only makes sense if your child can attend. If the address or entry year rules it out, compare another building before paying the premium.', '只有孩子确实能够入读，才值得为附近的学校多付钱。若房屋地址或入学年份不符合条件，应先比较其他楼栋或小区。'),
    couple: decisionText('당장 쓰지 않을 학군에 예산을 얼마나 배정할지부터 정하세요. 향후 자녀 계획이 있다면 가까운 학교 이름보다 입학 시점의 조건이 중요합니다.', 'Decide how much of the budget to devote to schools you will not use immediately. Future family plans depend on entry-year conditions, not simply a school appearing nearby.', '先决定愿意为暂时用不到的教育资源支付多少。如果计划要孩子，应按将来的入学年份核实条件，不能只看地图上附近的校名。'),
    investor: decisionText('학교가 가깝다는 이유만으로 가족 임차 수요를 확정할 수는 없습니다. 해당 주소의 입학 조건이 확인되기 전에는 학군 프리미엄을 수입 전망에 넣지 마세요.', 'A nearby school does not establish family rental demand. Keep an assumed school premium out of projected income until the address-specific admission position is clear.', '学校近不等于已经有稳定的家庭租客需求。在核实具体地址的入学条件前，不应把学区溢价算进预计租金。'),
    question: decisionText('입주 연도의 배정·입학 조건을 해당 주소로 확인했나요?', 'Has admission been checked for this address and entry year?', '是否已按这套房的地址和入学年份核实入学条件？'),
    reversal: decisionText('예상한 학교를 이용하지 못하면 학군을 위해 더 내는 가격부터 다시 따져야 합니다.', 'If the expected school is unavailable, reconsider how much extra the school setting is worth.', '如果无法入读预期学校，就需要重新衡量为教育条件支付的溢价。'),
  },
  schoolRoute: {
    title: decisionText('아이의 실제 통학', 'The school-day journey', '孩子每天的上学路线'),
    family: decisionText('등교뿐 아니라 하교와 방과후 귀가까지 보호자 없이 가능한지가 관건입니다. 길이 복잡하거나 계속 차로 데려다줘야 한다면 그 부담을 집값과 함께 비교하세요.', 'The useful test covers school, pickup and the journey home after activities. Complicated crossings or a daily car escort belong in the housing tradeoff.', '应把上学、放学和课外活动后的回家路线一起考虑。复杂路口或每天开车接送带来的负担，也属于购房成本。'),
    couple: decisionText('향후 가족이 늘어날 가능성이 있다면 지금의 출근 동선과 이후의 통학 동선을 나란히 보세요. 둘을 함께 감당하기 어렵다면 오래 살 집으로는 조건이 달라집니다.', 'Set today’s commute beside a possible future school run. A home becomes a different long-term choice if both journeys are difficult to manage together.', '如果以后可能有孩子，应把现在的通勤和将来的接送放在一起比较。两种行程难以兼顾，会改变这套房作为长期住所的适合程度。'),
    investor: decisionText('가족 임차인을 염두에 둔다면 학교까지의 거리보다 실제 등하교 부담이 중요합니다. 통학버스나 보호자 차량이 꼭 필요한 조건은 임대 비교에서도 따로 봐야 합니다.', 'For family tenants, the actual school run matters more than a distance label. A required school bus or daily car escort should remain explicit in the rental comparison.', '面向家庭租客时，实际接送负担比地图距离更重要。若必须依赖校车或家长开车，应在出租房比较中单独考虑。'),
    question: decisionText('이 동에서 등교와 방과후 귀가를 모두 걸어봤나요?', 'Have both the school run and after-school return been tested from this building?', '是否从这栋楼实走过上学及课外活动后的回家路线？'),
    reversal: decisionText('학교 이전이나 배정 변경으로 통학이 길어지면 현재의 가족 실거주 판단도 달라집니다.', 'A campus move or allocation change can overturn the family-living case by lengthening the school run.', '校址搬迁或学区调整若拉长接送路线，家庭自住的判断也应改变。'),
  },
  transit: {
    title: decisionText('출근과 귀가 동선', 'The daily commute', '每天的通勤路线'),
    family: decisionText('출퇴근과 아이의 하루를 같은 일정 안에 넣어보세요. 역이 가까워도 환승이나 픽업 때문에 귀가가 늦어진다면 가족에게 주는 이점은 줄어듭니다.', 'Fit the commute and the child’s day into one timetable. A nearby station is less useful if transfers or pickup still make the return home difficult.', '把通勤和孩子的安排放进同一张时间表。即使车站近，换乘或接送仍可能让回家变得不方便。'),
    couple: decisionText('두 사람의 직장까지 문에서 문으로 이동하는 경로를 비교하세요. 한 사람의 출근만 편해지는 입지라면 집값에 반영된 역세권 가치를 그대로 받아들일 이유가 없습니다.', 'Compare door-to-door journeys to both workplaces. If the location only helps one person, the station premium deserves closer scrutiny.', '比较两个人从家门到工作地点的完整路线。如果只方便其中一人，就应重新衡量车站附近的价格溢价。'),
    investor: decisionText('임차인이 실제로 갈 업무지와 이용 노선을 정해야 교통의 가치를 비교할 수 있습니다. 가까운 역 이름만으로 넓은 임대 수요를 가정하지 마세요.', 'Identify the tenant’s likely workplace and usable line before assigning value to transport. The nearest station name alone is not evidence of broad rental demand.', '先明确目标租客的工作地点和实际会搭乘的线路，再判断交通的价值。不能仅凭最近的站名推定出租需求。'),
    question: decisionText('실제 출근 시간에 집 문부터 목적지까지 가봤나요?', 'Has the full door-to-door trip been tested at the time you would travel?', '是否在实际出门时段走过从家门到目的地的完整路线？'),
    reversal: decisionText('업무지나 이용 가능한 노선이 바뀌면 역 접근에 더 낼 이유도 다시 계산해야 합니다.', 'A change in workplace or usable service changes what the station access is worth to the household.', '工作地点或可用线路改变后，也应重新计算为交通便利多付钱的理由。'),
  },
  transfer: {
    title: decisionText('환승과 운행 조건', 'Transfers and service', '换乘及班次条件'),
    family: decisionText('환승과 대기 시간은 등하교·픽업 일정에 여유가 있는지까지 좌우합니다. 가장 가까운 역보다 가족이 실제로 쓸 노선과 시간대를 기준으로 비교하세요.', 'Transfers and waiting can determine whether pickup times work. Compare the service the family will use, not just the closest station.', '换乘和等车会影响能否按时接送孩子。应比较一家人真正使用的线路和时段，而不只是最近的车站。'),
    couple: decisionText('급행·직통·셔틀이 있어도 대기와 환승을 합친 귀가가 편해야 합니다. 배차가 맞지 않는 시간에 퇴근한다면 소개된 이동 시간의 이점은 줄어듭니다.', 'An express, direct train or shuttle only helps if the waiting and return trip work. The advertised advantage can shrink when working hours miss the useful departures.', '有快车、直达车或接驳车，也要看等车和回程是否方便。下班时间若赶不上合适班次，宣传中的时间优势会减弱。'),
    investor: decisionText('셔틀·환승 편의가 임대 경쟁력이라면 현재 운행표와 이용 조건을 먼저 확보하세요. 향후 노선이나 예정된 증편을 현재 임대료의 근거로 쓰기는 어렵습니다.', 'If a shuttle or transfer is part of the rental case, obtain its current timetable and access rules. Future routes or extra services do not justify today’s rent.', '若接驳或换乘是出租卖点，应先取得当前时刻表及使用规则。未来线路或计划增班不能直接支持今天的租金。'),
    question: decisionText('필요한 시간대의 실제 배차와 마지막 귀가편을 확인했나요?', 'Have the useful departures and last practical return service been checked?', '是否核实需要时段的班次和最后一班可行的回程？'),
    reversal: decisionText('운행 축소나 환승 증가로 하루 이동 부담이 커지면 현재의 교통 프리미엄이 약해집니다.', 'Reduced service or an extra transfer can weaken the current transport premium.', '班次减少或增加换乘，都会削弱现有交通条件的溢价。'),
  },
  entrance: {
    title: decisionText('동·출입구별 접근', 'Building and entrance', '楼栋与出入口'),
    family: decisionText('유모차나 아이와 함께 다니는 길은 단지 대표 핀으로 판단하기 어렵습니다. 계단·횡단·차량 진입을 포함해 매물의 동에서 시작한 길이 편한지 보세요.', 'A map pin cannot settle a route with a child or stroller. Start at the actual building and include steps, crossings and vehicle entrances.', '小区定位点无法说明带孩子或推婴儿车是否方便。应从具体楼栋出发，把台阶、过街和车行出入口算进去。'),
    couple: decisionText('퇴근 후 장을 보고 돌아오는 마지막 구간까지 짧아야 역세권을 체감합니다. 엘리베이터 대기와 단지 안 이동을 빼면 다른 단지와의 비교가 어긋납니다.', 'The last leg home with groceries is part of station convenience. Excluding lift waits and internal walking distorts comparisons with other buildings.', '下班买完东西回家的最后一段，也属于车站便利性。忽略电梯等候和小区内部步行，会让楼盘比较失真。'),
    investor: decisionText('같은 단지라도 역과 가까운 동의 임대 조건을 먼 동에 적용할 수는 없습니다. 매입할 동·출입구와 비교 임대의 위치를 맞춘 뒤 가격 차이를 보세요.', 'Do not apply the rental terms of the nearest block to one further inside the estate. Match the building and entrance before comparing the price difference.', '不能把靠近车站楼栋的租赁条件套用到小区深处。应先匹配楼栋和出入口，再比较购入价与租金。'),
    question: decisionText('대표 출입구 대신 이 매물의 현관에서 출발해봤나요?', 'Did the route start at this apartment rather than the main estate entrance?', '路线是否从这套房的门口出发，而不是从小区主入口计算？'),
    reversal: decisionText('주요 통로의 운영시간이나 출입 조건이 달라지면 안내된 접근성도 달라집니다.', 'A change in passage hours or access rules can change the practical approach.', '主要通道的开放时间或出入规则改变后，实际便利程度也会变化。'),
  },
  retail: {
    title: decisionText('매일 쓰는 상권', 'Everyday errands', '日常购物与办事'),
    family: decisionText('장보기·병원·아이 이동을 한 번의 외출에 묶을 수 있는지가 중요합니다. 큰 쇼핑시설이 가까워도 매번 차를 꺼내야 한다면 생활의 편의는 다릅니다.', 'The useful question is whether groceries, healthcare and children’s trips fit into one outing. A large mall nearby offers a different benefit if every errand still needs a car.', '关键是买菜、就医和带孩子外出能否顺路完成。大型商场虽近，若每次都得开车，日常便利性仍然不同。'),
    couple: decisionText('집에 돌아오는 시간에 실제로 쓸 가게가 열려 있어야 상권의 이점이 남습니다. 주말의 북적임과 평일 저녁의 장보기를 따로 경험해보세요.', 'The shops you use need to be open when you return home. Treat weekend activity and weekday-evening groceries as separate viewing tests.', '回家时常用店铺仍营业，商圈才真正有用。周末的人流和工作日晚上的购物，应分别体验。'),
    investor: decisionText('상업시설이 있다는 사실과 주거 수요가 유지된다는 판단은 다릅니다. 매입할 동에서 사용할 수 있는 생활시설과 공실·임대 조건을 각각 비교하세요.', 'The presence of retail does not establish sustained residential demand. Compare usable daily services from the chosen building separately from rental terms and vacancy.', '有商业设施并不能证明住宅租赁需求会持续。应分别比较具体楼栋可用的生活配套、租赁条件和空置情况。'),
    question: decisionText('평소 귀가 시간에 필요한 장보기와 생활 용무가 가능한가요?', 'Can ordinary errands be completed at your usual arrival time?', '平时回家的时间，还能完成必要的购物和日常事务吗？'),
    reversal: decisionText('주요 점포가 바뀌거나 연결 통로가 제한되면 현재의 생활 동선부터 다시 확인해야 합니다.', 'A key store change or restricted connection can alter the daily routine.', '主要店铺更换或连接通道受限后，需要重新核实日常动线。'),
  },
  amenities: {
    title: decisionText('실제로 이용할 시설', 'Facilities you will use', '真正会使用的设施'),
    family: decisionText('가족이 쓸 시설의 연령 조건·예약·운영시간이 맞아야 단지 안에서 해결할 일이 늘어납니다. 사진 속 시설 수보다 한 주에 얼마나 이용할지 생각해보세요.', 'Facilities help when age rules, booking and opening hours fit the family. Their value depends on a normal week’s use, not the number shown in photographs.', '设施的年龄限制、预约规则和开放时间符合家庭安排，才会有实际价值。应看每周会使用多少次，而不是照片里有多少项。'),
    couple: decisionText('직장 근처나 외부 시설을 더 자주 쓴다면 단지 시설에 더 낼 이유가 줄어듭니다. 퇴근 후 이용 가능한지와 추가 요금을 함께 비교하세요.', 'If facilities near work would get more use, there is less reason to pay extra for them at home. Compare after-work access and any additional charges.', '如果更常使用公司附近或外部的设施，就少了为小区配套多付钱的理由。应同时比较下班后的可用时间和额外收费。'),
    investor: decisionText('시설은 임대 경쟁력이 될 수 있지만 이용 규정과 유지비가 함께 따라옵니다. 임차인에게 열려 있는 범위와 소유자가 부담할 비용을 나눠 계산하세요.', 'Amenities may help a rental compete, but access rules and upkeep come with them. Separate what tenants may use from the costs left with the owner.', '配套可能帮助出租竞争，但也带来使用规则和维护费。应分清租客能用什么，以及业主还要承担哪些费用。'),
    question: decisionText('우리 가족·임차인이 원하는 시간에 실제로 이용할 수 있나요?', 'Can the household or tenant actually use these facilities at the required times?', '家庭成员或租客能否在需要的时间实际使用这些设施？'),
    reversal: decisionText('운영 축소·유료화·예약 제한이 생기면 시설 때문에 더 낸 비용의 의미가 달라집니다.', 'Reduced hours, extra charges or booking limits change what an amenity premium buys.', '缩短开放时间、增加收费或限制预约，都会改变配套溢价的实际价值。'),
  },
  noise: {
    title: decisionText('창 방향과 소음', 'Exposure and noise', '朝向与噪声'),
    family: decisionText('아이 방과 잠자는 시간의 소음을 기준으로 보세요. 접근성이 좋아도 침실을 옮기거나 창문을 계속 닫아야 한다면 그 조건에 맞는 가격인지 따져야 합니다.', 'Test the child’s room and the hours the household sleeps. Good access needs a price tradeoff if bedrooms or open-window living do not work.', '应按孩子房间和全家睡觉时段测试噪声。交通再方便，若卧室或开窗生活不合适，也应反映在价格判断中。'),
    couple: decisionText('낮의 방문만으로 밤이나 주말의 소리를 판단하기 어렵습니다. 재택근무·수면 시간에 창을 열고 닫아 비교한 뒤 상권과 역의 편의를 평가하세요.', 'A daytime visit does not settle evening or weekend noise. Test windows open and closed at working and sleeping hours before valuing the busy location.', '白天看房不能代表夜间或周末。应在居家工作及睡觉时段比较开窗和关窗的声音，再评价热闹地段的便利。'),
    investor: decisionText('동일 면적이라도 소음 노출이 다르면 같은 임대료를 기대하기 어렵습니다. 조용한 방향의 사례를 그대로 적용하지 말고 수리로 해결 가능한 범위도 확인하세요.', 'Equal floor area does not justify equal rent when noise exposure differs. Avoid borrowing the quiet-facing unit’s terms and establish what any remedial work can change.', '面积相同不代表噪声条件不同的房源也能获得相同租金。不要套用安静朝向的案例，并应核实改造能解决多少问题。'),
    question: decisionText('이 방향의 침실에서 필요한 시간대에 직접 들어봤나요?', 'Has this bedroom orientation been checked at the hours that matter?', '是否在关键时段亲自听过这一朝向卧室内的声音？'),
    reversal: decisionText('예상보다 큰 야간 소음이나 활동량이 확인되면 상권·교통 때문에 감수할 가격을 낮춰야 합니다.', 'Unexpected night-time noise or activity lowers the case for paying extra for nearby retail or transport.', '若发现超出预期的夜间噪声或活动，就应降低为商圈及交通便利支付溢价的意愿。'),
  },
  view: {
    title: decisionText('조망과 실내 쾌적성', 'Outlook and comfort', '景观与室内舒适度'),
    family: decisionText('가족이 오래 머무는 방의 채광·열·환기가 우선입니다. 거실 한쪽의 전망 때문에 침실 조건까지 좋다고 가정하면 실제 거주에서 실망할 수 있습니다.', 'Prioritise light, heat and ventilation in the rooms the family uses most. A living-room view says little about the bedrooms.', '应优先看家人常用房间的采光、热感和通风。客厅一侧的景观并不能代表卧室也舒适。'),
    couple: decisionText('전망을 자주 누릴 시간과 창 방향의 열·눈부심을 같이 보세요. 낮에 비어 있는 집이라면 조망에 더 내는 돈보다 출퇴근 편의가 더 큰 가치를 줄 수 있습니다.', 'Set the hours you will enjoy the view beside heat and glare from that orientation. An empty daytime home may benefit more from an easier commute than a higher view premium.', '应把实际欣赏景观的时间与该朝向的热感、眩光一起衡量。白天常不在家的话，便利通勤可能比景观溢价更有用。'),
    investor: decisionText('조망은 단지 이름이 아니라 해당 세대에 붙는 조건입니다. 같은 방향·층의 사례와 비교하고 향후 가림 가능성이 가격에 이미 반영됐는지 살펴보세요.', 'A view belongs to a particular unit, not the development name. Compare the same orientation and floor position, including any potential obstruction.', '景观属于具体房源，不属于楼盘名字。应匹配朝向和楼层进行比较，并考虑未来遮挡的可能性。'),
    question: decisionText('소개 사진과 같은 방향인지, 침실의 열·환기까지 확인했나요?', 'Does the photographed view match this unit, and have bedroom heat and ventilation been checked?', '介绍照片是否对应这套房，卧室的热感和通风也检查过了吗？'),
    reversal: decisionText('조망 가림이나 예상 밖의 열·환기 문제가 확인되면 현재의 조망 프리미엄을 다시 비교해야 합니다.', 'An obstructed outlook or unexpected heat and ventilation issues can undermine a view premium.', '如果景观受遮挡，或热感、通风出现预期外的问题，就应重新比较景观溢价。'),
  },
  parking: {
    title: decisionText('차량 이용 조건', 'Car and parking needs', '用车与停车条件'),
    family: decisionText('세대당 평균 대수보다 우리 집 차량 등록과 늦은 귀가 때의 주차가 중요합니다. 통학에 차가 필요한 가구라면 주차장부터 현관까지의 이동도 포함하세요.', 'The household’s registration rights and late-evening availability matter more than an average spaces-per-home figure. Include parking-to-door travel if school trips need a car.', '本户车辆能否登记、晚归时能否停车，比平均车位数更重要。需要开车接送孩子的家庭，还应计入车库到家门的路线。'),
    couple: decisionText('차를 쓰지 않거나 한 대만 필요하다면 넉넉한 주차가 높은 가격을 설명하지 못할 수 있습니다. 실제 등록 가능 대수와 별도 비용을 생활 방식에 맞춰 보세요.', 'Abundant parking may add little value to a household without a car or needing just one. Compare registration rights and extra charges against actual use.', '不用车或只需要一辆车的家庭，未必需要为大量车位多付钱。应按真实用车需求比较登记资格和额外费用。'),
    investor: decisionText('주차가 임대에 포함되는지, 별도 계약인지에 따라 순수입과 모집 조건이 달라집니다. 평균 대수를 임차인의 확정 권리처럼 설명하지 마세요.', 'Whether parking is included or separately contracted affects income and rental terms. An estate average is not the tenant’s guaranteed entitlement.', '停车是包含在租赁中还是另行签约，会改变净收入和招租条件。小区平均车位数不等于租客的确定权利。'),
    question: decisionText('이 세대의 등록 가능 대수·비용·야간 주차 조건은 무엇인가요?', 'What are this unit’s registration rights, charges and evening parking conditions?', '这套房能登记几辆车，费用及夜间停车条件如何？'),
    reversal: decisionText('차량 등록 제한이나 추가 요금이 달라지면 차량이 필요한 가구의 총주거비도 바뀝니다.', 'Registration restrictions or new charges change the total cost for a household that needs a car.', '车辆登记限制或收费变化，会改变有车家庭的整体住房成本。'),
  },
  fees: {
    title: decisionText('실제 보유·생활 비용', 'Actual recurring costs', '实际持续支出'),
    family: decisionText('매월 낼 돈에는 관리비뿐 아니라 난방·냉방·시설 이용도 들어갑니다. 같은 면적의 실제 고지서로 계산해야 교육비와 함께 감당할 예산이 보입니다.', 'The monthly budget includes heating or cooling and amenity charges as well as management. Bills for the same unit size show what remains alongside education costs.', '每月支出除了管理费，还包括供暖、制冷和设施使用费。用相同面积的实际账单计算，才能判断与教育开支合起来是否负担得起。'),
    couple: decisionText('낮에 비우는 집인지 재택근무를 하는지에 따라 사용료의 체감이 달라집니다. 고정 관리비와 사용량에 따라 달라지는 항목을 나눠 다른 집과 비교하세요.', 'An empty daytime home and a work-from-home routine use utilities differently. Separate fixed building charges from usage before comparing homes.', '白天不在家与居家办公的水电使用不同。应先区分固定楼宇费用和按用量计费的项目，再比较不同房源。'),
    investor: decisionText('예상 임대료에서 집주인이 낼 관리비와 수선비를 빼고, 세입자 없이 비어 있는 기간도 반영해 실제로 얼마가 남는지 계산하세요. 광고에 나온 임대료 전부가 수익으로 남는 것은 아닙니다.', 'Subtract owner-paid charges and repairs from expected rent, and allow for time without a tenant. The advertised rent is not the amount you keep.', '扣除业主承担的费用、维修及空置成本后，购入价仍应有合理依据。仅用挂牌租金计算收益率，会漏掉重要支出。'),
    question: decisionText('이 세대의 최근 고지서에서 고정비·사용료·별도 이용료를 나눴나요?', 'Have this unit’s recent bills been split into fixed, usage and optional charges?', '是否把这套房近期账单中的固定费、用量费和额外使用费分开了？'),
    reversal: decisionText('고정비나 별도 부담금이 늘면 현재의 매입가와 임대 조건이 주는 여유도 줄어듭니다.', 'Higher fixed charges or extra assessments reduce the margin in the current purchase or rental case.', '固定费用或额外分摊增加，会压缩当前买入价或出租方案的余地。'),
  },
  repair: {
    title: decisionText('수선과 추가 지출', 'Repairs and future spending', '维修及后续支出'),
    family: decisionText('입주 직후 고칠 부분과 거주 중 예정된 공사를 나눠보세요. 실내가 새로워도 공용설비의 교체 시기와 추가 납부가 가족 예산을 바꿀 수 있습니다.', 'Separate work needed before moving in from works during ownership. New interiors do not remove shared-equipment replacement or extra household payments.', '应区分入住前要修的部分和居住期间计划中的工程。室内翻新并不会消除公共设备更换或额外缴费的负担。'),
    couple: decisionText('입주 시기와 수리 일정이 맞지 않으면 임시 거처나 이사 비용이 더 들 수 있습니다. 수리된 범위와 남은 설비를 구분해 총입주비로 비교하세요.', 'If repairs and the move-in date do not align, temporary accommodation and another move can add costs. Compare the full move-in bill, distinguishing renewed items from remaining work.', '维修与入住时间若不匹配，可能增加临时住宿或再次搬家的费用。应分清已更新部分和剩余工程，比较完整入住成本。'),
    investor: decisionText('수선은 일회성 지출과 임대 중단을 함께 만들 수 있습니다. 공사 계획·적립 상태·소유자 부담을 확인하기 전에는 낮은 현재 관리비를 장점으로 잡지 마세요.', 'Repairs can mean both a cash payment and lost rent. Low current charges are not an advantage until the works plan, reserves and owner’s share are understood.', '维修可能同时带来现金支出和停租损失。核实工程计划、储备金及业主分摊前，不能把当前低管理费直接算作优势。'),
    question: decisionText('남은 공사·추가 납부·입주 지연 가능성을 문서로 받았나요?', 'Are remaining works, extra payments and possible move-in delays documented?', '是否取得剩余工程、额外缴费及可能延迟入住的书面资料？'),
    reversal: decisionText('예상하지 못한 대규모 수선이나 추가 납부가 결정되면 총매입비와 보유 계획을 다시 계산해야 합니다.', 'Unplanned major works or an extra assessment require a new total-cost and holding calculation.', '一旦决定进行预期外的大规模维修或额外分摊，就应重新计算总购入成本和持有计划。'),
  },
  tenure: {
    title: decisionText('보유권과 매도 시점', 'Tenure and eventual resale', '产权期限与未来出售'),
    family: decisionText('오래 살 계획이라면 나중에 팔 때 남는 권리 기간까지 봐야 합니다. 생활이 편해도 만기·종료 비용이 장기 거주 계획과 맞지 않으면 대안이 달라집니다.', 'For a long stay, consider the remaining right when the home is eventually sold. Good daily life still needs to fit any expiry and end-of-term costs.', '计划长期居住时，应考虑未来出售时还剩多少产权期限。生活方便也要与到期条件及期末费用相匹配。'),
    couple: decisionText('가족 구성이나 직장이 바뀌어 예상보다 일찍 팔 가능성도 함께 보세요. 입지에 더 내는 돈과 보유권 조건을 따로 비교해야 선택이 선명해집니다.', 'Allow for selling earlier if work or family plans change. Compare what is paid for location separately from the tenure conditions.', '也应考虑工作或家庭变化导致提前出售的可能。把地段溢价与产权期限条件分开比较，选择才会更清楚。'),
    investor: decisionText('보유 기간이 끝날 때의 잔여 권리와 매수 가능한 수요를 함께 검토해야 합니다. 권리 형태가 다른 단지의 가격이나 임대수익을 그대로 대입하지 마세요.', 'Consider the remaining right at exit and the buyers it may suit. Do not import prices or rental returns from a development with different tenure.', '应把退出时的剩余期限和可能的接手买家一起考虑。不能直接套用产权性质不同楼盘的价格或租赁回报。'),
    question: decisionText('계약상 보유권의 종료 조건과 예상 매도 시점의 잔여 기간은 무엇인가요?', 'What are the contractual end conditions and the remaining term at the planned sale date?', '合同中的到期条件是什么，计划出售时还剩多少年？'),
    reversal: decisionText('대출·매도 조건이나 보유권 종료 비용이 예상과 다르면 현재 가격의 비교 기준부터 달라집니다.', 'Unexpected financing, resale restrictions or end-of-term costs change the basis for comparing the price.', '融资、转售条件或期末费用若与预期不同，价格比较的基础也会改变。'),
  },
  handover: {
    title: decisionText('입주 일정과 납부 계획', 'Handover and funding', '交付与付款计划'),
    family: decisionText('아이의 입학·전학 시기와 실제 입주 가능 시점이 맞아야 합니다. 주택 인도와 학교·상가의 운영 시작은 별개이므로 일정이 늦어질 때의 거주비도 남겨두세요.', 'The usable move-in date needs to fit school entry or a transfer. Home handover and the opening of schools or shops are separate; allow for housing costs if timing slips.', '实际可入住时间需要配合入学或转学。住宅交付与学校、商店开业并非同一件事，计划中应留出延迟时的居住费用。'),
    couple: decisionText('새집에 들어갈 날을 기준으로 현재 임대 만기와 이사를 맞추세요. 예정일만 믿고 계약을 끝내면 지연 기간의 임시 거처 비용이 추가될 수 있습니다.', 'Align the move with the current tenancy using a usable handover date. Ending a lease on a target alone can add temporary-housing costs if delivery slips.', '应以实际可入住的交付安排衔接现租约和搬家。仅按目标日期退租，交付延期时可能多付临时住宿费。'),
    investor: decisionText('잔금 전에 들어갈 현금과 임대가 시작되기까지의 공백을 함께 계산하세요. 낮은 계약금이나 공정률만으로 자금 부담과 인도 시점을 판단할 수는 없습니다.', 'Calculate cash due before completion and the gap until rent can begin. A small deposit or a progress percentage does not settle the funding burden or delivery date.', '应同时计算竣工前要投入的现金和开始收租前的空档。低首付款或施工进度比例，不能单独说明资金压力及交付时间。'),
    question: decisionText('인도 지연 시 거주비·추가 자금·계약상 처리 조건은 무엇인가요?', 'What happens to housing costs, funding and contractual remedies if handover is delayed?', '交付延迟时，居住费用、补充资金和合同处理条款如何安排？'),
    reversal: decisionText('인도 지연이나 납부 일정 변경이 생기면 임시 거주비와 임대 개시 시점을 다시 계산해야 합니다.', 'A handover delay or payment change requires a fresh calculation of interim housing and the start of rent.', '交付延迟或付款计划改变后，应重新计算临时居住成本及开始收租的时间。'),
  },
  price: {
    title: decisionText('같은 조건의 가격', 'Prices on matched terms', '相同条件下的价格'),
    family: decisionText('가족에게 필요한 방 구성·동선·수리 상태를 먼저 고정한 뒤 가격을 비교하세요. 면적이 같아도 바로 살 수 있는 집과 공사가 필요한 집의 예산은 다릅니다.', 'Fix the required rooms, routes and repair condition before comparing prices. Equal size does not make a move-in-ready home and a renovation project equal budgets.', '先确定家庭需要的房间配置、动线和维修状态，再比较价格。面积相同，直接入住与需要翻修的预算仍然不同。'),
    couple: decisionText('넓이를 더 사는 대신 출근이 멀어지거나 수리비가 붙는지 보세요. 실제로 사용할 공간과 총입주비가 같아야 더 저렴한 선택인지 판단할 수 있습니다.', 'Look at whether buying more space adds commuting or repairs. Useful rooms and the complete move-in cost need to match before calling one choice cheaper.', '应看多买一些面积是否增加通勤或维修成本。实际可用空间和完整入住成本相当，才有基础判断哪套更便宜。'),
    investor: decisionText('같은 면적·동·층·상태의 성사 거래와 비교하기 전에는 저평가로 결론 내리기 어렵습니다. 거래 표본과 현재 호가를 나누고 보유비까지 포함해 계산하세요.', 'An undervaluation claim needs completed sales matched by size, building, floor and condition. Keep the sale sample separate from current asks and include ownership costs.', '判断低估需要面积、楼栋、楼层和状态相匹配的成交。应区分成交样本与当前挂牌价，并计入持有成本。'),
    question: decisionText('비교 거래의 면적·동·층·상태와 총입주비를 맞췄나요?', 'Do the comparable sales match size, building, floor, condition and total move-in cost?', '比较成交是否匹配面积、楼栋、楼层、状态和总入住成本？'),
    reversal: decisionText('같은 조건의 새 거래가 낮게 성사되거나 수리 견적이 늘면 현재 호가를 받아들일 근거가 약해집니다.', 'A lower matched sale or a higher repair quote weakens the case for the current asking price.', '相同条件的新成交价更低，或维修报价上升，都会削弱接受当前挂牌价的理由。'),
  },
  hazard: {
    title: decisionText('건물별 안전과 대비', 'Building-specific resilience', '楼栋安全与应急准备'),
    family: decisionText('재난 때 아이와 이동할 경로, 엘리베이터·급수 중단 시의 생활을 함께 생각해야 합니다. 설계상 장치가 있다는 사실과 현재 작동·운영 상태는 구분하세요.', 'Consider evacuation with children and daily life without lifts or water. A system in the original design is separate from its current working condition.', '应考虑带孩子疏散，以及停梯、停水时的生活。原设计中有设备，与设备当前能否正常运转，需要分别核实。'),
    couple: decisionText('출근 시간이나 혼자 집에 있을 때의 대피·비상 대응을 기준으로 보세요. 지도상의 위험 범위와 해당 층·공용설비에 미치는 영향을 별도로 확인해야 합니다.', 'Assess evacuation and emergency arrangements for commuting hours and time alone at home. Map coverage and the effects on this floor and shared equipment need separate checks.', '应按通勤时段及独自在家的情况考虑疏散和应急。地图上的风险范围，与对具体楼层和公共设备的影响，应分别确认。'),
    investor: decisionText('안전 설비는 유지·교체 예산과 보험·임대 중단 가능성까지 이어집니다. 원래의 구조 설명을 현재 점검 기록이나 손실이 없다는 보장으로 바꾸지 마세요.', 'Resilience also involves maintenance budgets, insurance and potential interruption to rent. Original structural specifications are not a current inspection or a guarantee against loss.', '安全设施还涉及维护更换预算、保险和停租可能。原有结构说明不能替代当前检查记录，也不代表损失保证为零。'),
    question: decisionText('이 동의 최근 점검 기록과 실제 비상 운영 범위를 받았나요?', 'Are recent inspection records and the actual emergency operating scope available for this building?', '是否取得这栋楼近期检查记录和实际应急运行范围？'),
    reversal: decisionText('점검상 결함이나 대피·설비 운영의 공백이 드러나면 비용과 거주 판단을 함께 다시 봐야 합니다.', 'Inspection defects or gaps in evacuation and equipment operation require a fresh living and cost assessment.', '检查发现缺陷，或疏散、设备运行存在缺口，就需要重新评估居住与费用条件。'),
  },
  identity: {
    title: decisionText('동·유형을 맞춘 비교', 'The correct building and type', '对应楼栋与房屋类型'),
    family: decisionText('같은 이름의 단지라도 동·단계·주택 유형에 따라 생활 조건이 다를 수 있습니다. 가족이 실제로 살 집의 도면과 배정·출입 조건에 맞춰 비교하세요.', 'A shared development name can hide different buildings, phases and home types. Use the plans, school position and access of the home the family would occupy.', '同一楼盘名称下，楼栋、分期和住宅类型可能不同。应按一家人真正入住的房屋图纸、入学条件和出入口比较。'),
    couple: decisionText('소개된 공용시설이나 이동 시간을 모든 동에 적용하지 마세요. 방문한 집과 계약서의 동·주소·주택 유형이 같아야 공간과 편의의 비교가 맞습니다.', 'Do not transfer amenities or journey times across every building. Match the viewed home with the contract’s building, address and property type.', '不要把介绍中的设施或交通时间套用到所有楼栋。看过的房源应与合同中的楼栋、地址及房屋类型一致。'),
    investor: decisionText('이름이 비슷한 프로젝트나 다른 주택 유형의 거래를 섞으면 가격 판단부터 어긋납니다. 계약 대상의 권리·동·유형을 고정하고 비교 표본을 다시 좁히세요.', 'Mixing similarly named projects or property types corrupts the price comparison. Fix the rights, building and type in the contract, then narrow the sale sample.', '混用名称相近项目或不同房屋类型的成交，会使价格判断失真。应先固定合同标的的权利、楼栋及类型，再缩小成交样本。'),
    question: decisionText('자료·방문 매물·계약서가 모두 같은 동과 주택 유형인가요?', 'Do the evidence, viewed home and contract all refer to the same building and property type?', '资料、看过的房源和合同是否都对应同一楼栋及房屋类型？'),
    reversal: decisionText('계약 대상의 동·단계·권리가 달라지면 다른 집을 비교하던 셈이므로 판단을 처음부터 다시 맞춰야 합니다.', 'A different building, phase or right means the assessment concerned another home and needs rebuilding.', '合同标的的楼栋、分期或权利不同，就意味着此前比较的是另一套房，需要重新判断。'),
  },
} satisfies Record<string, Topic>;

export type DecisionTopic = keyof typeof decisionTopics;
