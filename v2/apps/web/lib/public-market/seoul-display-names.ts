// Display aliases only. Source names remain the identity and map-search text.
// Unmapped names are retained rather than assigning an invented English brand.
const neighborhoods: Readonly<Record<string, string>> = {
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
