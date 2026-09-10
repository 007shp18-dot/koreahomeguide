export type ToolMarket = 'kr-seoul' | 'sg-singapore' | 'ae-dubai' | 'jp-tokyo';
export type ScenarioCurrency = 'KRW' | 'SGD' | 'AED' | 'JPY';
export type PropertyScenarioContext = Readonly<{
 market: ToolMarket; currency: ScenarioCurrency; entity: string | null; propertyName: string | null;
 transaction: 'sale' | null; housing: string | null; areaSqm: number | null; price: number | null; returnTo: string | null;
 passportHref?: string;
 annualRent?: number | null;
 areaBand?: string;
}>;
export type PropertyScenarioSearchParams = Readonly<Record<string,string | readonly string[] | undefined>>;
const currencies = {'kr-seoul':'KRW','sg-singapore':'SGD','ae-dubai':'AED','jp-tokyo':'JPY'} as const;
const scalar = (v: unknown) => typeof v === 'string' ? v : null;
function label(v: unknown, max: number) { const s = scalar(v)?.trim(); return s && s.length <= max && !/[\u0000-\u001f\u007f]/.test(s) ? s : null; }
function amount(v: unknown, max = Number.MAX_SAFE_INTEGER) {
 const s = scalar(v); if(s === null || !/^\d+(?:\.\d+)?$/.test(s)) return null;
 const n = Number(s); return Number.isFinite(n) && n > 0 && n <= max ? n : null;
}
export function passportReturn(value: unknown): string | undefined {
 const raw = scalar(value);
 if (!raw || raw.length > 256 || !raw.startsWith('/') || raw.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(raw)) return undefined;
 try {
  const url = new URL(raw, 'https://signedprice.invalid');
  if (url.origin !== 'https://signedprice.invalid' || !['/passport/','/ko/passport/','/zh-cn/passport/'].includes(url.pathname) || url.hash) return undefined;
  if ([...url.searchParams.keys()].some(key => !['budget','currency','dubaiStage'].includes(key)) || url.searchParams.getAll('budget').length !== 1 || url.searchParams.getAll('currency').length > 1) return undefined;
  if (url.searchParams.getAll('dubaiStage').length > 1 || (url.searchParams.has('dubaiStage') && !['ready','off-plan'].includes(url.searchParams.get('dubaiStage')!))) return undefined;
  const budget = url.searchParams.get('budget');
  if (amount(budget,100_000_000_000) === null || (url.searchParams.has('currency') && !['USD','KRW','SGD','AED','JPY'].includes(url.searchParams.get('currency')!))) return undefined;
  return `${url.pathname}${url.search}`;
 } catch { return undefined; }
}
export function parsePropertyScenarioContext(input: PropertyScenarioSearchParams, locale: 'en'|'ko'|'zh-CN' = 'en'): PropertyScenarioContext {
 const market = input.market === undefined && input.currency === undefined ? 'kr-seoul' : scalar(input.market);
 const currency = input.market === undefined && input.currency === undefined ? 'KRW' : scalar(input.currency);
 const blank: PropertyScenarioContext = {market:'kr-seoul',currency:'KRW',entity:null,propertyName:null,transaction:null,housing:null,areaSqm:null,price:null,returnTo:null};
 if(!market || !(market in currencies) || currencies[market as ToolMarket] !== currency) return blank;
 let returnTo: string | null = null;
 const raw = scalar(input.returnTo);
 const prefix = market === 'kr-seoul' ? `${locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''}/kr/seoul/` : market === 'sg-singapore' ? '/sg/singapore/' : market === 'jp-tokyo' ? '/jp/tokyo/' : '/ae/dubai/';
 const allowedPrefixes = locale !== 'en' && market !== 'kr-seoul' ? [prefix, `${locale === 'ko' ? '/ko' : '/zh-cn'}${prefix}`] : [prefix];
 if(raw && raw.length <= 2048 && raw.startsWith('/') && !raw.startsWith('//') && !/[\\\u0000-\u001f\u007f]/.test(raw)) {
  try { const url = new URL(raw,'https://signedprice.invalid'); if(url.origin === 'https://signedprice.invalid' && allowedPrefixes.some(candidate => url.pathname.startsWith(candidate))) returnTo = `${url.pathname}${url.search}${url.hash}`; } catch { /* Optional context. */ }
 }
 const entity = scalar(input.entity);
 const passportHref = passportReturn(input.passport);
 return {market: market as ToolMarket,currency:currency as ScenarioCurrency,entity:entity && /^[a-z0-9-]{1,120}$/.test(entity) ? entity : null,
  ...(typeof input.areaBand === 'string' && ['all','under-40','40-60','60-85','85-plus'].includes(input.areaBand) ? {areaBand:input.areaBand} : {}),propertyName:label(input.property,120),transaction:input.transaction === 'sale' ? 'sale' : null,housing:label(input.housing,60),areaSqm:amount(input.area,10000),price:amount(input.price),returnTo,...(input.annualRent === undefined ? {} : {annualRent:amount(input.annualRent)}),...(passportHref ? {passportHref} : {})};
}
export function createPropertyScenarioHref(input: Partial<PropertyScenarioContext> & {locale:'en'|'ko'|'zh-CN';market:ToolMarket;currency:ScenarioCurrency}): string {
 const raw = {market:input.market,currency:input.currency,entity:input.entity ?? undefined,property:input.propertyName ?? undefined,transaction:input.transaction ?? undefined,housing:input.housing ?? undefined,area:input.areaSqm == null ? undefined:String(input.areaSqm),price:input.price == null ? undefined:String(input.price),returnTo:input.returnTo ?? undefined,passport:input.passportHref,areaBand:input.areaBand};
 const c=parsePropertyScenarioContext({...raw,...(input.annualRent == null ? {} : {annualRent:String(input.annualRent)})},input.locale);
 const params=new URLSearchParams({market:c.market,currency:c.currency});
 for(const [key,value] of [['entity',c.entity],['property',c.propertyName],['transaction',c.transaction],['housing',c.housing],['area',c.areaSqm],['price',c.price],['returnTo',c.returnTo]] as const) if(value !== null) params.set(key,String(value));
 if(c.areaBand) params.set('areaBand',c.areaBand);
 if(c.passportHref) params.set('passport',c.passportHref);
 if(c.annualRent != null) params.set('annualRent',String(c.annualRent));
 const base=`${input.locale === 'ko' ? '/ko' : input.locale === 'zh-CN' ? '/zh-cn' : ''}/tools/property-scenario/`;
 return params.size === 2 && c.market === 'kr-seoul' ? base : `${base}?${params}`;
}
