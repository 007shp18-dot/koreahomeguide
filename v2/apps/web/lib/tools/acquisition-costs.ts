export type CostProfile = { koreaRate: 'standard' | '8' | '12'; over85: boolean; singaporeBuyer: 'citizen' | 'pr' | 'foreigner'; owned: number; taxBase: number; dubaiBuyerShare: 2 | 4; brokerPct: number };
export type CostLine = { en: string; ko: string; amount: number; kind: 'tax' | 'fee' | 'assumption' };
export const COST_RULES_CHECKED = '2026-09-07';
export const COST_SOURCES = {
  KRW: [ ['Seoul acquisition tax', 'https://news.seoul.go.kr/gov/archives/200082'], ['Local education tax', 'https://news.seoul.go.kr/gov/archives/200123'], ['Housing surtaxes', 'https://www.gwangjin.go.kr/portal/main/contents.do?menuNo=200792'], ['Seoul brokerage caps', 'https://land.seoul.go.kr/land/broker/brokerageCommission.do'] ],
  SGD: [ ['IRAS BSD', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29'], ['IRAS ABSD', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29'], ['FTA remission', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29'] ],
  AED: [ ['DLD sale registration fees', 'https://dubailand.gov.ae/en/eservices/property-sale-registration/'] ],
} as const;
export function residentialBsd(value: number): number {
  let remaining = value, duty = 0;
  for (const [width, rate] of [[180000,.01],[180000,.02],[640000,.03],[500000,.04],[1500000,.05],[Infinity,.06]]) { const taxable = Math.min(remaining, width!); duty += taxable * rate!; remaining -= taxable; if (remaining <= 0) break; }
  return Math.max(1, Math.floor(duty));
}
export function acquisitionCosts(price: number, currency: 'KRW' | 'SGD' | 'AED', p: CostProfile): { lines: CostLine[]; total: number } | null {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(p.taxBase) || p.taxBase < 0 || !Number.isFinite(p.brokerPct) || p.brokerPct < 0 || p.brokerPct > 10 || !Number.isInteger(p.owned) || p.owned < 0) return null;
  const lines: CostLine[] = [];
  const add = (en: string, ko: string, amount: number, kind: CostLine['kind'] = 'tax') => lines.push({ en, ko, amount: Math.round(amount), kind });
  if (currency === 'KRW') {
    const rate = p.koreaRate === 'standard' ? price <= 600_000_000 ? .01 : price > 900_000_000 ? .03 : Math.round(((price / 100_000_000) * 2 / 3 - 3) * 10000) / 1000000 : Number(p.koreaRate) / 100;
    add('Acquisition tax', '취득세', price * rate);
    add('Local education tax', '지방교육세', price * (p.koreaRate === 'standard' ? rate * .1 : .004));
    if (p.over85) add('Rural special tax', '농어촌특별세', price * (p.koreaRate === 'standard' ? .002 : p.koreaRate === '8' ? .006 : .01));
    const broker = price < 50_000_000 ? Math.min(price*.006,250000) : price < 200_000_000 ? Math.min(price*.005,800000) : price < 900_000_000 ? price*.004 : price < 1_200_000_000 ? price*.005 : price < 1_500_000_000 ? price*.006 : price*.007;
    add('Brokerage cap · before VAT', '중개보수 상한 · 부가세 별도', broker, 'fee');
  } else if (currency === 'SGD') {
    const base = Math.max(price, p.taxBase);
    add('BSD', 'BSD 인지세', residentialBsd(base));
    const rate = p.singaporeBuyer === 'foreigner' ? .6 : p.singaporeBuyer === 'pr' ? p.owned === 0 ? .05 : p.owned === 1 ? .3 : .35 : p.owned === 0 ? 0 : p.owned === 1 ? .2 : .3;
    add('ABSD · before remission', 'ABSD 추가 인지세 · 감면 전', Math.floor(base * rate));
  } else {
    add(`DLD registration · buyer pays ${p.dubaiBuyerShare}%`, `DLD 등록비 · 구매자 ${p.dubaiBuyerShare}% 부담`, price * p.dubaiBuyerShare / 100, 'fee');
    add('Service partner · including 5% VAT', '서비스 파트너 수수료 · VAT 5% 포함', (price >= 500000 ? 4000 : 2000) * 1.05, 'fee');
    add('Title, apartment/villa map, knowledge and innovation', '등기·주택 지도·지식·혁신 수수료', 520, 'fee');
    add(`Brokerage assumption · ${p.brokerPct}% + 5% VAT`, `중개보수 가정 · ${p.brokerPct}% + VAT 5%`, price * p.brokerPct / 100 * 1.05, 'assumption');
  }
  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0) };
}
