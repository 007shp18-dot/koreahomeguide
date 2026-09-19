'use client';
import { consultationHref } from '../../content/city-buying-content';
import { TOKYO_BUDGET_METHOD } from '../../content/tokyo-budget-method';
import { cityText } from '../../content/city-buying-content';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { buyingGuideHref, buyingMoney, type BuyingCityModel } from '../../lib/home/buying-journey';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import { sendGoogleEvent } from '../../lib/analytics/google-events';
import { ExploreLink } from '../market-ui/explore-link';
import { UiIcon } from '../ui-icon';
import { BUYING_JOURNEY_COPY } from './buying-journey-copy';
import styles from './buying-journey.module.css';

type CityPhoto = { src: string; caption: { en: string; ko: string }; position: string };
export function BuyingJourney({ models, photos, locale }: Readonly<{
  models: readonly BuyingCityModel[]; photos: Readonly<Record<string, CityPhoto>>; locale: SiteLocale;
}>) {
  const [selection, setSelection] = useState<{ city: string; band: number } | null>(null);
  const selected = models.find(model => model.city === selection?.city);
  const band = selected?.bands[selection?.band ?? 1];
  const copy = BUYING_JOURNEY_COPY[locale];
  const budgetHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!selected || !window.matchMedia('(max-width: 700px)').matches) return;
    budgetHeading.current?.focus({ preventScroll: true });
    budgetHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [selected]);
  const record = (market: string, action: string) => sendGoogleEvent('home_buying_action', { market, action, locale, surface: 'home' });
  const number = (value: number) => value.toLocaleString(locale === 'zh-CN' ? 'zh-CN' : locale, { maximumFractionDigits: 2 });
  const compactMoney = (value: number, currency: string) => locale === 'en' ? new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'code', notation: 'compact', maximumFractionDigits: 2 }).format(value) : buyingMoney(value, currency, locale);
  const range = (values: readonly number[], format: (value: number) => string) => values[0] === values[1] ? format(values[0]!) : `${format(values[0]!)}–${format(values[1]!)}`;
  const languageNote = (model: BuyingCityModel) => model.guideLocale !== locale ? ' · English' : '';
  const eventContext = (model: BuyingCityModel) => ({ 'data-editorial-content-id': model.slug, 'data-editorial-content-type': 'guide', 'data-editorial-market': model.market, 'data-editorial-locale': locale });
  return <div className={styles.journey}>
    <section data-home-region="markets" aria-labelledby="buying-city-title">
      <div className={styles.sectionHeading}><h2 id="buying-city-title" tabIndex={-1}>{copy.choose}</h2><p>{copy.hint}</p></div>
      <ol className={styles.cities}>
        {models.map((model, index) => {
          const photo = photos[model.market]!;
          return <li key={model.city} data-city-destination={model.city} data-market-id={model.market} data-contextual-action={model.market} {...eventContext(model)}>
            <button type="button" className={styles.city} aria-pressed={selection?.city === model.city}
              aria-label={model.name} aria-controls="buying-selection" data-buying-city={model.city}
              onClick={() => { setSelection({ city: model.city, band: 1 }); record(model.market, 'city_select'); }}>
              <span className={styles.photo}><Image src={photo.src} alt={photo.caption[locale === 'ko' ? 'ko' : 'en']} fill
                loading={index < 2 ? 'eager' : 'lazy'} sizes="(max-width: 700px) 50vw, 25vw" style={{ objectPosition: photo.position }} /></span>
              <span className={styles.cityLabel}><strong>{model.name}</strong><span>{locale === 'ko' ? ({ seoul: '동네마다 다른 삶의 모습', singapore: '도시와 일상의 균형', dubai: '세계가 만나는 새로운 주거', tokyo: '나에게 맞는 동네의 발견' }[model.city]) : locale === 'zh-CN' ? ({ seoul: '探索不同社区的生活', singapore: '城市与生活的平衡', dubai: '世界交汇的居住地', tokyo: '发现适合你的社区' }[model.city]) : ({ seoul: 'A neighbourhood for every life', singapore: 'A city shaped around living', dubai: 'A different perspective on home', tokyo: 'Find your part of the city' }[model.city])}</span><UiIcon name="arrow-right" /></span>
            </button>
            <div className={styles.cityLinks}>
              <Link href={model.guideHref} data-editorial-event="article_open">{copy.guide}{languageNote(model)}</Link>
              <ExploreLink href={model.exploreHref} data-primary-action="explore" data-editorial-event="article_to_explore">{copy.explore}<UiIcon name="arrow-right" /></ExploreLink>
            </div>
          </li>;
        })}
      </ol>
    </section>
    <div id="buying-selection">
      <p className={styles.status} role="status">{selected && band ? `${selected.name} · ${buyingMoney(band.cap, selected.currency, locale)} · ${copy.results}` : ''}</p>
      {selected && band && <div className={styles.selection} data-buying-results={selected.city} {...eventContext(selected)}>
        <div className={styles.budgetPanel}>
          <div><p className={styles.budgetLabel}><span>{selected.name} · {selected.currency}</span><a href="#buying-city-title">{copy.changeCity}</a></p><h2 ref={budgetHeading} tabIndex={-1}>{copy.budget}</h2><p className={styles.note}>{copy.budgetNote}</p></div>
          <div className={styles.budgetChoices}>
            <div role="group" aria-label={copy.budget} className={styles.chips}>
              {selected.bands.map((option, index) => <button type="button" key={option.cap} aria-label={buyingMoney(option.cap, selected.currency, locale)} aria-pressed={option.cap === band.cap}
                onClick={() => { setSelection({ city: selected.city, band: index }); record(selected.market, 'budget_select'); }}>
                {compactMoney(option.cap, selected.currency)}
              </button>)}
            </div>
            <Link href={buyingGuideHref(selected, band.cap)} className={styles.primary} data-editorial-event="article_open">{copy.viewGuide}{languageNote(selected)}<UiIcon name="arrow-right" /></Link>
          </div>
        </div>
        <section className={styles.results} aria-labelledby="buying-result-title">
          <div className={styles.resultHeading}><div><h2 id="buying-result-title">{copy.results}</h2><p>{selected.period}</p></div><span className={styles.history}>{copy.history}</span></div>
          <div className={styles.examples} data-example-scope={selected.scope}>
            {band.examples.map((example, index) => <article className={styles.example} key={`${selected.city}-${band.cap}-${index}`}>
              <div className={styles.exampleIdentity}><p className={styles.eyebrow}>{example.region}</p><h3>{example.name}</h3><p className={styles.detail}>{example.detail}</p></div>
              <dl><div><dt>{copy.area}</dt><dd className={styles.area}>{range(example.area, number)} <span>m²</span></dd></div>
                <div><dt>{copy.price}</dt><dd>{range(example.price, value => compactMoney(value, selected.currency))}</dd></div></dl>
              <p className={styles.note}>{example.count} {copy.records}<br />{copy.latest} · {selected.scope === 'neighbourhood' ? selected.period : new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(example.latest))}</p>
              <Link href={example.evidenceHref ?? buyingGuideHref(selected, band.cap)} data-editorial-event="article_open">{copy.evidence}{languageNote(selected)}<UiIcon name="arrow-right" /></Link>
            </article>)}
          </div>
          <p className={styles.scope}>{selected.scope === 'neighbourhood' ? cityText(TOKYO_BUDGET_METHOD, locale) : copy.scope} {copy.original}</p>
        </section>
        <nav className={styles.nextSteps} aria-label={locale === 'ko' ? '다음 단계' : locale === 'zh-CN' ? '下一步' : 'Next steps'}>
          <Link href={`${selected.costsHref}&price=${band.cap}`} className={styles.secondary}>{copy.costsAction}<UiIcon name="arrow-right" /></Link>
          <ExploreLink href={selected.checkHref} className={styles.secondary} data-editorial-event={selected.scope === 'neighbourhood' ? 'article_to_explore' : 'article_to_check'}>{selected.scope === 'neighbourhood' ? copy.tokyoCheck : copy.check}<UiIcon name="arrow-right" /></ExploreLink>
        </nav>
        <p><Link className={styles.primary} href={consultationHref(selected.city,locale,band.cap)}>{locale==='ko'?'이 조건으로 구매상담 문의':locale==='zh-CN'?'按此条件咨询购房':'Prepare a purchase enquiry'}</Link></p>
      </div>}
    </div>
  </div>;
}
