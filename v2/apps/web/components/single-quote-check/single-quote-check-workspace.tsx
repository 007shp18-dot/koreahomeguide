import Link from 'next/link';

import type { ProductLocale } from '../../lib/locale/product-copy';
import type { SingleQuoteCheckRouteModel } from '../../lib/single-quote-check/route-model.server';
import { SiteHeader } from '../site-header';
import styles from './single-quote-check.module.css';

const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
});

const copy = {
  en: {
    nav: 'Check', eyebrow: 'Seoul · Official transaction evidence',
    title: 'Check one asking price.',
    intro: 'Compare a sale, jeonse or monthly-rent quote with compatible reported contracts.',
    transaction: 'Transaction type', district: 'District', housing: 'Property type', area: 'Exclusive area',
    building: 'Building ID (optional)', buildingHint: 'Use an observed building ID from Explore for building-level evidence.',
    price: 'Asking price', deposit: 'Deposit', submit: 'Check this quote',
    compare: 'Compare two rental offers', explore: 'Find a building in Explore',
    result: 'Quote result', median: 'Reported median', middle: 'Middle 50%', sample: 'Evidence sample',
    insufficient: 'Not enough compatible contracts', noVerdict: 'No price verdict is published below five compatible reported contracts.',
    scope: { building: 'Same building', neighborhood: 'Same neighborhood', district: 'Same district' },
    verdict: { below: 'Below typical range', typical: 'Typical range', above: 'Above typical range' },
    reference: 'Market reference only. Not an appraisal, legal opinion or financial recommendation.',
  },
  ko: {
    nav: '가격 확인', eyebrow: '서울 · 실거래 신고 근거',
    title: '매물 하나의 가격을 확인하세요.',
    intro: '매매·전세·월세 제시가격을 조건이 맞는 신고 거래와 비교합니다.',
    transaction: '거래 유형', district: '자치구', housing: '주택 유형', area: '전용면적',
    building: '건물 ID (선택)', buildingHint: 'Explore의 관측 건물 ID를 입력하면 건물 단위 근거부터 확인합니다.',
    price: '제시가격', deposit: '보증금', submit: '이 가격 확인',
    compare: '임대차 조건 두 개 비교', explore: 'Explore에서 건물 찾기',
    result: '가격 확인 결과', median: '신고 중앙값', middle: '중간 50%', sample: '근거 표본',
    insufficient: '비교 가능한 신고 거래가 부족합니다', noVerdict: '조건이 맞는 신고 거래가 5건 미만이면 가격 판정을 공개하지 않습니다.',
    scope: { building: '동일 건물', neighborhood: '동일 동네', district: '동일 자치구' },
    verdict: { below: '통상 범위보다 낮음', typical: '통상 범위', above: '통상 범위보다 높음' },
    reference: '시장 참고자료이며 감정평가·법률·금융 자문이 아닙니다.',
  },
} as const;

function href(locale: ProductLocale, suffix = ''): string {
  return `${locale === 'ko' ? '/ko' : ''}/kr/seoul/check${suffix}`;
}

function header(locale: ProductLocale) {
  const c = copy[locale];
  const localizedLinks = locale === 'ko' ? [
    { label: '가격 확인', href: '/ko/kr/seoul/check/', isCurrent: true },
    { label: '구별 탐색', href: '/ko/kr/seoul/explore/' },
    { label: '근거 순위', href: '/ko/kr/seoul/rankings/' },
    { label: '뉴스', href: '/ko/kr/seoul/news/' },
    { label: '가이드', href: '/ko/kr/seoul/guide/' },
  ] : [{ label: c.nav, href: href(locale, '/'), isCurrent: true }];
  return {
    brand: 'signedprice',
    homeLabel: locale === 'ko' ? 'signedprice 홈' : 'SignedPrice home',
    navigationLabel: locale === 'ko' ? '서울 서비스 메뉴' : 'Seoul product navigation',
    marketLabel: 'Seoul', languageLabel: locale === 'ko' ? 'KO' : 'EN',
    links: localizedLinks,
    navigationVariant: locale === 'ko' ? 'supplied' as const : undefined,
    languageSwitch: locale === 'ko'
      ? { label: 'EN', href: '/kr/seoul/check/', hrefLang: 'en' as const }
      : { label: 'KO', href: '/ko/kr/seoul/check/', hrefLang: 'ko' as const },
  };
}

function Result({ model, locale }: Readonly<{
  model: SingleQuoteCheckRouteModel;
  locale: ProductLocale;
}>) {
  const c = copy[locale];
  const result = model.result;
  if (!model.submitted || result === null) return null;
  if (result.status === 'insufficient') {
    return (
      <section className={styles.result} data-check-result="insufficient">
        <p>{c.result}</p><h2>{c.insufficient}</h2>
        <p>{c.noVerdict}</p>
        <p>{result.sampleCount} reported contracts · {result.period}</p>
      </section>
    );
  }
  return (
    <section className={styles.result} data-check-result={result.verdict}>
      <p>{c.result}</p>
      <h2>{c.verdict[result.verdict]}</h2>
      <p>{model.buildingName === null ? null : `${model.buildingName} · `}{c.scope[result.scope]}</p>
      <div className={styles.metrics}>
        <div><span>{c.median}</span><strong>{won.format(result.medianWon)}</strong></div>
        <div><span>{c.middle}</span><strong>{won.format(result.middleHalfWon[0])}–{won.format(result.middleHalfWon[1])}</strong></div>
        <div><span>{c.sample}</span><strong>{result.sampleCount} reported contracts</strong></div>
      </div>
      <p>±{result.areaTolerancePct}% area · {result.period}</p>
      <p>{result.differencePct === 0 ? 'At median' : `${Math.abs(result.differencePct)}% ${result.differencePct < 0 ? 'below' : 'above'} median`}</p>
      <p className={styles.boundary}>{result.comparisonBasis === 'deposit-adjusted-monthly-rent'
        ? 'Monthly contracts are restated at the entered deposit using the disclosed 5% annual conversion assumption.'
        : 'Direct comparison with official reported transaction values.'}</p>
      <p className={styles.boundary}>The compatible sample is drawn from the retained recent-contract ledger, capped at 20 records per observed building.</p>
    </section>
  );
}

export function SingleQuoteCheckWorkspace({ model, locale = 'en' }: Readonly<{
  model: SingleQuoteCheckRouteModel;
  locale?: ProductLocale;
}>) {
  const c = copy[locale];
  const selection = model.selection;
  return (
    <div className={styles.page} data-primary-check="single-quote" lang={locale}>
      <SiteHeader copy={header(locale)} />
      <main className={styles.main}>
        <header className={styles.intro}>
          <p>{c.eyebrow}</p><h1>{c.title}</h1><p>{c.intro}</p>
        </header>
        <nav className={styles.mode} aria-label="Check mode">
          <span aria-current="page">{locale === 'ko' ? '매물 가격 확인' : 'Check one quote'}</span>
          <Link href={href(locale, '/compare/')}>{c.compare}</Link>
        </nav>
        <form className={styles.form} action={href(locale, '/')} method="get">
          <input type="hidden" name="check" value="1" />
          <label><span>{c.transaction}</span><select name="transaction" defaultValue={selection.transaction}>
            <option value="sale" disabled={!model.availability.sale}>{locale === 'ko' ? '매매' : 'Sale'}</option>
            <option value="jeonse" disabled={!model.availability.jeonse}>{locale === 'ko' ? '전세' : 'Jeonse'}</option>
            <option value="monthly" disabled={!model.availability.monthly}>{locale === 'ko' ? '월세' : 'Monthly rent'}</option>
          </select></label>
          <label><span>{c.district}</span><select name="district" defaultValue={selection.districtSlug}>
            {model.districts.map((district) => <option key={district.slug} value={district.slug}>{locale === 'ko' ? district.nameKo : district.nameEn}</option>)}
          </select></label>
          <label><span>{c.housing}</span><select name="housing" defaultValue={selection.housingType}>
            <option value="apartment">{locale === 'ko' ? '아파트' : 'Apartment'}</option>
            <option value="officetel">{locale === 'ko' ? '오피스텔' : 'Officetel'}</option>
            <option value="villa_multifamily">{locale === 'ko' ? '연립·다세대' : 'Villa / multifamily'}</option>
            <option value="detached">{locale === 'ko' ? '단독·다가구' : 'Detached'}</option>
          </select></label>
          <label><span>{c.area} <small>㎡</small></span><input name="area" inputMode="decimal" defaultValue={selection.areaSqm} /></label>
          <label><span>{c.building}</span><input name="building" defaultValue={selection.buildingId ?? ''} aria-describedby="building-hint" /><small id="building-hint">{c.buildingHint}</small></label>
          <label><span>{c.deposit} <small>KRW · {locale === 'ko' ? '월세만 사용' : 'monthly rent only'}</small></span><input name="deposit" inputMode="numeric" defaultValue={selection.depositWon ?? 100_000_000} /></label>
          <label><span>{c.price} <small>KRW</small></span><input name="price" inputMode="numeric" defaultValue={selection.quoteWon} /></label>
          <button type="submit">{c.submit}</button>
        </form>
        <Result model={model} locale={locale} />
        <nav className={styles.links} aria-label="More evidence">
          <Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{c.explore}</Link>
          <Link href={href(locale, '/compare/')}>{c.compare}</Link>
        </nav>
      </main>
      <footer className={styles.footer}><p>{c.reference}</p></footer>
    </div>
  );
}
