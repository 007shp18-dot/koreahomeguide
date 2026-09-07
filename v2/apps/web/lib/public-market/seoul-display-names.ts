// Display aliases only. Source names remain the identity and map-search text.
// Unmapped names are retained rather than assigning an invented English brand.
const neighborhoods: Readonly<Record<string, string>> = {
  '화곡동': 'Hwagok-dong', '봉천동': 'Bongcheon-dong', '방배동': 'Bangbae-dong',
  '목동': 'Mok-dong', '삼전동': 'Samjeon-dong', '석촌동': 'Seokchon-dong',
  '신월동': 'Sinwol-dong', '자양동': 'Jayang-dong', '천호동': 'Cheonho-dong',
  '송파동': 'Songpa-dong', '방이동': 'Bangi-dong', '상도동': 'Sangdo-dong',
  '역삼동': 'Yeoksam-dong', '잠실동': 'Jamsil-dong', '구의동': 'Guui-dong',
  '중곡동': 'Junggok-dong', '성내동': 'Seongnae-dong', '사당동': 'Sadang-dong',
  '면목동': 'Myeonmok-dong', '독산동': 'Doksan-dong', '서초동': 'Seocho-dong',
  '신정동': 'Sinjeong-dong', '양재동': 'Yangjae-dong', '가락동': 'Garak-dong',
  '망원동': 'Mangwon-dong', '논현동': 'Nonhyeon-dong', '암사동': 'Amsa-dong',
  '신사동': 'Sinsa-dong', '문정동': 'Munjeong-dong', '대치동': 'Daechi-dong',
  '개봉동': 'Gaebong-dong', '역촌동': 'Yeokchon-dong', '성산동': 'Seongsan-dong',
  '정릉동': 'Jeongneung-dong', '반포동': 'Banpo-dong', '갈현동': 'Galhyeon-dong',
  '장위동': 'Jangwi-dong', '길동': 'Gil-dong', '장안동': 'Jangan-dong',
  '삼성동': 'Samseong-dong', '북가좌동': 'Bukgajwa-dong', '합정동': 'Hapjeong-dong',
  '대조동': 'Daejo-dong', '신당동': 'Sindang-dong', '개포동': 'Gaepo-dong',
  '신길동': 'Singil-dong', '신천동': 'Sincheon-dong', '고척동': 'Gocheok-dong',
  '서교동': 'Seogyo-dong', '자곡동': 'Jagok-dong', '신내동': 'Sinnae-dong',
  '상일동': 'Sangil-dong', '고덕동': 'Godeok-dong', '거여동': 'Geoyeo-dong',
  '이문동': 'Imun-dong', '망우동': 'Mangu-dong', '길음동': 'Gireum-dong',
  '도곡동': 'Dogok-dong', '한남동': 'Hannam-dong', '이태원동': 'Itaewon-dong',
  '청담동': 'Cheongdam-dong', '공덕동': 'Gongdeok-dong', '연남동': 'Yeonnam-dong',
  '용강동': 'Yonggang-dong', '아현동': 'Ahyeon-dong', '대흥동': 'Daeheung-dong',
  '도화동': 'Dohwa-dong', '옥수동': 'Oksu-dong', '행당동': 'Haengdang-dong',
  '응봉동': 'Eungbong-dong', '금호동1가': 'Geumho-dong 1-ga', '금호동2가': 'Geumho-dong 2-ga',
  '금호동3가': 'Geumho-dong 3-ga', '금호동4가': 'Geumho-dong 4-ga',
  '성수동1가': 'Seongsu-dong 1-ga', '성수동2가': 'Seongsu-dong 2-ga',
  '여의도동': 'Yeouido-dong', '흑석동': 'Heukseok-dong', '이촌동': 'Ichon-dong',
  '둔촌동': 'Dunchon-dong', '명일동': 'Myeongil-dong', '풍납동': 'Pungnap-dong',
  '장지동': 'Jangji-dong', '오금동': 'Ogeum-dong', '마천동': 'Macheon-dong',
  '노량진동': 'Noryangjin-dong', '신대방동': 'Sindaebang-dong', '대방동': 'Daebang-dong',
  '상계동': 'Sanggye-dong', '중계동': 'Junggye-dong', '하계동': 'Hagye-dong',
  '월계동': 'Wolgye-dong', '공릉동': 'Gongneung-dong', '방학동': 'Banghak-dong',
  '도봉동': 'Dobong-dong', '창동': 'Chang-dong', '쌍문동': 'Ssangmun-dong',
  '등촌동': 'Deungchon-dong', '상봉동': 'Sangbong-dong', '중화동': 'Junghwa-dong',
  '홍은동': 'Hongeun-dong', '응암동': 'Eungam-dong', '미아동': 'Mia-dong',
  '돈암동': 'Donam-dong', '마곡동': 'Magok-dong', '시흥동': 'Siheung-dong',
  '신림동': 'Sillim-dong', '구로동': 'Guro-dong', '묵동': 'Muk-dong',
  '불광동': 'Bulgwang-dong', '녹번동': 'Nokbeon-dong', '수유동': 'Suyu-dong',
};
const buildings: Readonly<Record<string, string>> = {
  '헬리오시티': 'Helio City', '파크리오': 'Parkrio', '리센츠': 'Ricenz',
  '잠실엘스': 'Jamsil Els', '은마': 'Eunma', '트리지움': 'Trizium',
  '도곡렉슬': 'Dogok Rexle', '남산타운': 'Namsan Town',
  '고덕아르테온': 'Godeok Arteon', '고덕그라시움': 'Godeok Gracium',
  '상계주공9(고층)': 'Sanggye Jugong 9 (high-rise)',
  '우성아파트2': 'Woosung Apartment 2', '관악산휴먼시아2단지': 'Gwanaksan Humansia 2',
  '에스케이북한산시티': 'SK Bukhansan City', '백련산힐스테이트1차': 'Baengnyeonsan Hillstate 1',
  '백련산힐스테이트3차': 'Baengnyeonsan Hillstate 3', '남서울힐스테이트': 'Namseoul Hillstate',
};
export function neighborhoodDisplayName(name: string, locale: 'en' | 'ko'): string {
  return locale === 'en' && neighborhoods[name] ? `${neighborhoods[name]} · ${name}` : name;
}
export function buildingDisplayName(name: string, locale: 'en' | 'ko'): string {
  return locale === 'en' && buildings[name] ? `${buildings[name]} · ${name}` : name;
}
