import snapshot from './tokyo-budget-comparison-data.json';
import type { ContentLocale } from '../lib/content/content-types';
import { cityPrefix, cityText } from './city-buying-content';
const wards: Record<string, readonly string[]> = {
  '13102':['Chuo','주오구','中央区'], '13103':['Minato','미나토구','港区'], '13104':['Shinjuku','신주쿠구','新宿区'],
  '13105':['Bunkyo','분쿄구','文京区'], '13107':['Sumida','스미다구','墨田区'], '13108':['Koto','고토구','江东区'],
  '13111':['Ota','오타구','大田区'], '13112':['Setagaya','세타가야구','世田谷区'], '13114':['Nakano','나카노구','中野区'],
  '13115':['Suginami','스기나미구','杉并区'], '13119':['Itabashi','이타바시구','板桥区'], '13120':['Nerima','네리마구','练马区'], '13121':['Adachi','아다치구','足立区'],
};
export function tokyoBudgetBands(locale: ContentLocale) {
  return [30000000,50000000,100000000].map(cap=>({cap,examples:snapshot.rows.filter(row=>Number(row.cap)===cap).map(row=>({
    name: cityText(wards[row.city]!,locale), region: cityText(['Tokyo · ward comparison','도쿄 · 구별 비교','东京 · 各区比较'],locale),
    detail: cityText(['Anonymous pre-owned condominium group','익명 중고 맨션 거래 그룹','匿名二手公寓成交组'],locale),
    price:[Number(row.price_min),Number(row.price_max)], area:[Number(row.area_min),Number(row.area_max)], count:row.n, latest:'2026 Q1',
    evidenceHref:`${cityPrefix(locale)}/jp/tokyo/explore/?${new URLSearchParams({city:row.city,year:'2026',quarter:'1',type:'Pre-owned Condominiums, etc.',minArea:String(row.area_band),maxArea:String(Number(row.area_band)+19.99),release:row.release_id})}`,
  }))}));
}
