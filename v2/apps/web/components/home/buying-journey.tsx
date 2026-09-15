'use client';
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
  const range = (values: readonly number[], format: (value: number) => string) => values[0] === values[1] ? format(values[0]!) : `${format(values[0]!)}–${format(values[1]!)}`;
  const languageNote = (model: BuyingCityModel) => model.guideLocale !== locale ? ' · English' : '';
  const eventContext = (model: BuyingCityModel) => ({ 'data-editorial-content-id': model.slug, 'data-editorial-content-type': 'guide', 'data-editorial-market': model.market, 'data-editorial-locale': locale });
  return <div className={styles.journey}>
    <section data-home-region="markets" aria-labelledby="buying-city-title">
      <div className={styles.sectionHeading}><h2 id="buying-city-title" tabIndex={-1}>{copy.choose}</h2><p>{copy.hint}</p></div>
      <ol className={styles.cities}>
        {models.map((model, index) => {
          const photo = photos[model.market]!;
          return <li key={model.city} data-market-id={model.market} data-contextual-action={model.market} {...eventContext(model)}>
            <button type="button" className={styles.city} aria-pressed={selection?.city === model.city}
              aria-label={model.name} aria-controls="buying-selection" data-buying-city={model.city}
              onClick={() => { setSelection({ city: model.city, band: 1 }); record(model.market, 'city_select'); }}>
              <span className={styles.photo}><Image src={photo.src} alt={photo.caption[locale === 'ko' ? 'ko' : 'en']} fill
                loading={index < 2 ? 'eager' : 'lazy'} sizes="(max-width: 700px) 50vw, 25vw" style={{ objectPosition: photo.position }} /></span>
              <span className={styles.cityLabel}><strong>{model.name}</strong><span>{model.currency}</span><UiIcon name="arrow-right" /></span>
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
              {selected.bands.map((option, index) => <button type="button" key={option.cap} aria-pressed={option.cap === band.cap}
                onClick={() => { setSelection({ city: selected.city, band: index }); record(selected.market, 'budget_select'); }}>
                {buyingMoney(option.cap, selected.currency, locale)}
              </button>)}
            </div>
            <Link href={buyingGuideHref(selected, band.cap)} className={styles.primary} data-editorial-event="article_open">{copy.viewGuide}{languageNote(selected)}<UiIcon name="arrow-right" /></Link>
          </div>
        </div>
        <section className={styles.results} aria-labelledby="buying-result-title">
          <div className={styles.resultHeading}><div><h2 id="buying-result-title">{copy.results}</h2><p>{selected.period}</p></div><span className={styles.history}>{copy.history}</span></div>
          <div className={styles.examples} data-example-scope={selected.scope}>
            {band.examples.map((example, index) => <article className={styles.example} key={`${selected.city}-${band.cap}-${index}`}>
              <p className={styles.eyebrow}>{example.region}</p><h3>{example.name}</h3><p className={styles.detail}>{example.detail}</p>
              <dl><div><dt>{copy.area}</dt><dd className={styles.area}>{range(example.area, number)} <span>m²</span></dd></div>
                <div><dt>{copy.price}</dt><dd>{range(example.price, value => buyingMoney(value, selected.currency, locale))}</dd></div></dl>
              <p className={styles.note}>{example.count} {copy.records}<br />{copy.latest} · {selected.scope === 'neighbourhood' ? selected.period : new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : locale === 'zh-CN' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(example.latest))}</p>
              <Link href={buyingGuideHref(selected, band.cap)} data-editorial-event="article_open">{copy.evidence}{languageNote(selected)}<UiIcon name="arrow-right" /></Link>
            </article>)}
          </div>
          <p className={styles.scope}>{selected.scope === 'neighbourhood' ? copy.tokyoScope : copy.scope} {copy.original}</p>
        </section>
        <section className={styles.nextSteps} aria-label={locale === 'ko' ? '다음 단계' : locale === 'zh-CN' ? '下一步' : 'Next steps'}>
          <article><span className={styles.stepNumber}>01</span><h2>{copy.costs}</h2><p>{copy.costsNote}</p>
            <Link href={`${selected.costsHref}&price=${band.cap}`} className={styles.secondary}>{copy.costsAction}<UiIcon name="arrow-right" /></Link>
            <Link href={buyingGuideHref(selected, band.cap, 'costs')} data-editorial-event="article_open">{copy.feesAction}{languageNote(selected)}</Link></article>
          <article><span className={styles.stepNumber}>02</span><h2>{copy.offer}</h2><p>{selected.scope === 'neighbourhood' ? copy.tokyoCheckNote : copy.offerNote}</p>
            <ExploreLink href={selected.checkHref} className={styles.secondary} data-editorial-event={selected.scope === 'neighbourhood' ? 'article_to_explore' : 'article_to_check'}>{selected.scope === 'neighbourhood' ? copy.tokyoCheck : copy.check}<UiIcon name="arrow-right" /></ExploreLink></article>
        </section>
      </div>}
    </div>
  </div>;
}
