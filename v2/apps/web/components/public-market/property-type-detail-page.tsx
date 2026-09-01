import { getPublicMarketConfig } from '@signedprice/market-core';
import Link from 'next/link';

import type {
  PublicPropertyTypeIdentity,
  PublicPropertyTypeModel,
} from '../../lib/public-market/property-type-route-types';
import { publicCanonical, safeJsonLd } from '../../lib/public-metadata';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '../../lib/site-copy';
import { PublicBreadcrumbJsonLd } from '../public-json-ld';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { BoxPlot } from './box-plot';
import styles from './property-type-detail-page.module.css';

const config = getPublicMarketConfig('kr-seoul');
const money = new Intl.NumberFormat(config.formatLocale, {
  style: 'currency',
  currency: config.currencyCode,
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul jeonse evidence with retained-contract coverage shown.',
  navigationLabel: 'Property type evidence footer',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'Explore', href: '/kr/seoul/explore/' },
    { label: 'Check', href: '/kr/seoul/check/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

function headerFor(model: PublicPropertyTypeModel): SiteHeaderModel {
  return {
    brand: 'signedprice',
    homeLabel: 'signedprice home',
    navigationLabel: `${model.district.nameEn} ${model.propertyType.slug} navigation`,
    links: [
      { label: 'Global home', href: '/' },
      { label: 'Seoul market', href: '/kr/seoul/' },
      { label: 'District Explorer', href: '/kr/seoul/explore/' },
    ],
  };
}

function datasetJsonLd(model: PublicPropertyTypeModel) {
  const { distribution } = model;
  return Object.freeze({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${model.district.nameEn} ${model.propertyType.slug} retained jeonse evidence`,
    description: model.evidence.coverageNote,
    url: publicCanonical(
      `/kr/seoul/explore/${model.district.slug}/${model.propertyType.slug}/`,
    ),
    creator: Object.freeze({ '@type': 'Organization', name: 'MOLIT' }),
    temporalCoverage: model.evidence.period,
    measurementTechnique: 'Distribution of retained recent reported jeonse contracts',
    variableMeasured: Object.freeze([
      { name: 'Retained recent contracts', value: distribution.n },
      { name: 'Minimum refundable deposit', value: distribution.min, unitCode: 'KRW' },
      { name: '25th percentile refundable deposit', value: distribution.p25, unitCode: 'KRW' },
      { name: 'Median refundable deposit', value: distribution.med, unitCode: 'KRW' },
      { name: '75th percentile refundable deposit', value: distribution.p75, unitCode: 'KRW' },
      { name: 'Maximum refundable deposit', value: distribution.max, unitCode: 'KRW' },
    ]),
  });
}

export function PropertyTypeDetailPage({
  model,
  siblings,
}: Readonly<{
  model: PublicPropertyTypeModel;
  siblings: readonly PublicPropertyTypeIdentity[];
}>) {
  const axis = {
    min: model.distribution.min,
    max: model.distribution.max > model.distribution.min
      ? model.distribution.max
      : model.distribution.max + 1,
  };
  const typePath = `/kr/seoul/explore/${model.district.slug}/${model.propertyType.slug}/` as const;
  return (
    <div id="top" className={styles.page} data-property-type-detail={model.propertyType.slug}>
      <SiteHeader copy={headerFor(model)} />
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <ol>
            <li><Link href="/kr/seoul/explore/">Explore</Link></li>
            <li><a href={`/kr/seoul/explore/${model.district.slug}/`}>{model.district.nameEn}</a></li>
            <li aria-current="page">{model.propertyType.label}</li>
          </ol>
        </nav>
        <header className={styles.hero}>
          <p>Seoul · {model.district.nameKo}</p>
          <h1>{model.district.nameEn} {model.propertyType.slug} jeonse evidence</h1>
          <p>{model.evidence.coverageNote}</p>
        </header>
        <section className={styles.evidence} aria-labelledby="property-type-distribution">
          <div className={styles.sectionHeading}>
            <p>01 / Retained evidence</p>
            <h2 id="property-type-distribution">Reported refundable-deposit distribution</h2>
          </div>
          <dl className={styles.stats}>
            <div><dt>Median</dt><dd>{money.format(model.distribution.med)}</dd></div>
            <div><dt>Middle half</dt><dd>{money.format(model.distribution.p25)}–{money.format(model.distribution.p75)}</dd></div>
            <div><dt>Full range</dt><dd>{money.format(model.distribution.min)}–{money.format(model.distribution.max)}</dd></div>
            <div><dt>Retained sample</dt><dd>{model.coverage.retainedContracts} retained recent contracts</dd></div>
          </dl>
          <BoxPlot summary={model.distribution} axis={axis} formatValue={(value) => money.format(value)} />
        </section>
        <section className={styles.coverage} aria-labelledby="property-type-coverage">
          <div className={styles.sectionHeading}>
            <p>02 / Coverage boundary</p>
            <h2 id="property-type-coverage">What this page does and does not cover</h2>
          </div>
          <p>{model.evidence.coverageNote}</p>
          <dl className={styles.stats}>
            <div><dt>Source</dt><dd>{model.evidence.provider} {model.evidence.dataset}</dd></div>
            <div><dt>Declared period</dt><dd>{model.evidence.period}</dd></div>
            <div><dt>Published buildings retained</dt><dd>{model.coverage.retainedBuildings}</dd></div>
            <div><dt>Publication minimum</dt><dd>{model.coverage.publicationMinimum} contracts</dd></div>
          </dl>
        </section>
        <section className={styles.buildings} aria-labelledby="property-type-buildings">
          <div className={styles.sectionHeading}>
            <p>03 / Contributing buildings</p>
            <h2 id="property-type-buildings">Published building evidence used here</h2>
          </div>
          <ul>
            {model.buildings.map((building) => (
              <li key={building.id}>
                <a href={building.href}>
                  <strong>{building.name}</strong>
                  <span>{building.neighborhoodName} · {building.sampleCount} retained recent contracts</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <nav className={styles.siblings} aria-label="Other published property types">
          <a href={`/kr/seoul/explore/${model.district.slug}/`}>All {model.district.nameEn} evidence</a>
          {siblings.map((sibling) => (
            <a
              href={`/kr/seoul/explore/${model.district.slug}/${sibling.slug}/`}
              key={sibling.slug}
            >
              {sibling.label}
            </a>
          ))}
          <Link href="/kr/seoul/check/">Compare two contracts</Link>
          <Link href="/kr/seoul/rankings/">District rankings</Link>
        </nav>
      </main>
      <script
        type="application/ld+json"
        data-structured-data="dataset"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(datasetJsonLd(model)) }}
      />
      <PublicBreadcrumbJsonLd items={[
        { name: 'Home', path: '/' },
        { name: 'Seoul', path: '/kr/seoul/' },
        { name: 'Explore', path: '/kr/seoul/explore/' },
        { name: model.district.nameEn, path: `/kr/seoul/explore/${model.district.slug}/` },
        { name: model.propertyType.label, path: typePath },
      ]} />
      <SiteFooter copy={footer} />
    </div>
  );
}
