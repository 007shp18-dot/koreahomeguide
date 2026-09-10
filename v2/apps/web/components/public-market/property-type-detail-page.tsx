import { getPublicMarketConfig } from '@signedprice/market-core';
import Link from 'next/link';

import type {
  PublicPropertyTypeIdentity,
  PublicPropertyTypeModel,
} from '../../lib/public-market/property-type-route-types';
import { localizedSeoulHref, type ProductLocale } from '../../lib/locale/product-copy';
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

const englishFooter: SiteFooterModel = {
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

function footerFor(locale: ProductLocale): SiteFooterModel {
  if (locale === 'en') return englishFooter;
  return {
    brand: 'signedprice',
    descriptor: '공개 표본 수와 범위를 함께 보여주는 서울 전세 실거래가 자료입니다.',
    navigationLabel: '주택유형 자료 하단 메뉴',
    links: [
      { label: '홈', href: '/ko/' },
      { label: '서울 시장', href: '/ko/kr/seoul/' },
      { label: '탐색', href: '/ko/kr/seoul/explore/' },
      { label: '가격 비교', href: '/ko/kr/seoul/check/' },
      { label: '정정 내역', href: '/ko/kr/seoul/corrections/' },
    ],
    status: '서울 공개 실거래가 자료 · 공개 기준을 함께 표시합니다.',
  };
}

export function propertyTypeLabel(
  propertyType: PublicPropertyTypeIdentity,
  locale: ProductLocale = 'en',
): string {
  if (locale === 'en') return propertyType.label;
  if (propertyType.slug === 'apartment') return '아파트';
  if (propertyType.slug === 'officetel') return '오피스텔';
  return '연립·다세대';
}

function headerFor(model: PublicPropertyTypeModel, locale: ProductLocale): SiteHeaderModel {
  const ko = locale === 'ko';
  return {
    brand: 'signedprice',
    homeLabel: ko ? 'signedprice 홈' : 'signedprice home',
    homeHref: ko ? '/ko/' : '/',
    navigationLabel: ko
      ? `${model.district.nameKo} ${propertyTypeLabel(model.propertyType, locale)} 메뉴`
      : `${model.district.nameEn} ${model.propertyType.slug} navigation`,
    links: [
      { label: ko ? '홈' : 'Global home', href: ko ? '/ko/' : '/' },
      { label: ko ? '서울 시장' : 'Seoul market', href: localizedSeoulHref('/kr/seoul/', locale) },
      { label: ko ? '지역 탐색' : 'District Explorer', href: localizedSeoulHref('/kr/seoul/explore/', locale) },
    ],
  };
}

function koreanCoverageNote(model: PublicPropertyTypeModel): string {
  const buildingCount = model.coverage.contributingBuildings;
  return `공개 건물 ${buildingCount}곳의 최근 전세 계약 ${model.coverage.retainedContracts}건으로 분포를 계산했습니다. 구·주택유형 전체 계약 내역은 아닙니다.`;
}

function datasetJsonLd(model: PublicPropertyTypeModel, locale: ProductLocale) {
  const { distribution } = model;
  const ko = locale === 'ko';
  const root = locale === 'ko' ? '/ko' : '';
  return Object.freeze({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: ko
      ? `${model.district.nameKo} ${propertyTypeLabel(model.propertyType, locale)} 전세 실거래가`
      : `${model.district.nameEn} ${model.propertyType.slug} retained jeonse evidence`,
    description: ko ? koreanCoverageNote(model) : model.evidence.coverageNote,
    url: publicCanonical(
      `${root}/kr/seoul/explore/${model.district.slug}/${model.propertyType.slug}/` as `/${string}`,
    ),
    creator: Object.freeze({ '@type': 'Organization', name: 'MOLIT' }),
    temporalCoverage: model.evidence.period,
    measurementTechnique: ko ? '공개 기준을 충족한 최근 전세 신고 계약의 분포' : 'Distribution of retained recent reported jeonse contracts',
    variableMeasured: Object.freeze([
      { name: ko ? '최근 계약 표본' : 'Retained recent contracts', value: distribution.n },
      { name: ko ? '최저 전세 보증금' : 'Minimum refundable deposit', value: distribution.min, unitCode: 'KRW' },
      { name: ko ? '전세 보증금 25백분위' : '25th percentile refundable deposit', value: distribution.p25, unitCode: 'KRW' },
      { name: ko ? '전세 보증금 중앙값' : 'Median refundable deposit', value: distribution.med, unitCode: 'KRW' },
      { name: ko ? '전세 보증금 75백분위' : '75th percentile refundable deposit', value: distribution.p75, unitCode: 'KRW' },
      { name: ko ? '최고 전세 보증금' : 'Maximum refundable deposit', value: distribution.max, unitCode: 'KRW' },
    ]),
  });
}

export function PropertyTypeDetailPage({
  model,
  siblings,
  locale = 'en',
}: Readonly<{
  model: PublicPropertyTypeModel;
  siblings: readonly PublicPropertyTypeIdentity[];
  locale?: ProductLocale;
}>) {
  const ko = locale === 'ko';
  const axis = {
    min: model.distribution.min,
    max: model.distribution.max > model.distribution.min
      ? model.distribution.max
      : model.distribution.max + 1,
  };
  const enTypePath = `/kr/seoul/explore/${model.district.slug}/${model.propertyType.slug}/` as const;
  const typePath = localizedSeoulHref(enTypePath, locale) as `/${string}`;
  const explorePath = localizedSeoulHref('/kr/seoul/explore/', locale);
  const districtPath = localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/`, locale);
  return (
    <div id="top" className={styles.page} data-property-type-detail={model.propertyType.slug}>
      <SiteHeader copy={headerFor(model, locale)} />
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label={ko ? '이동 경로' : 'Breadcrumb'}>
          <ol>
            <li><Link href={explorePath}>{ko ? '탐색' : 'Explore'}</Link></li>
            <li><a href={districtPath}>{ko ? model.district.nameKo : model.district.nameEn}</a></li>
            <li aria-current="page">{propertyTypeLabel(model.propertyType, locale)}</li>
          </ol>
        </nav>
        <header className={styles.hero}>
          <p>{ko ? '서울' : 'Seoul'} · {model.district.nameKo}</p>
          <h1>{ko ? `${model.district.nameKo} ${propertyTypeLabel(model.propertyType, locale)} 전세 실거래가` : `${model.district.nameEn} ${model.propertyType.slug} jeonse evidence`}</h1>
          <p>{ko ? koreanCoverageNote(model) : model.evidence.coverageNote}</p>
        </header>
        <section className={styles.evidence} aria-labelledby="property-type-distribution">
          <div className={styles.sectionHeading}>
            <p>{ko ? '01 / 공개 자료' : '01 / Retained evidence'}</p>
            <h2 id="property-type-distribution">{ko ? '신고된 전세 보증금 분포' : 'Reported refundable-deposit distribution'}</h2>
          </div>
          <dl className={styles.stats}>
            <div><dt>{ko ? '중앙값' : 'Median'}</dt><dd>{money.format(model.distribution.med)}</dd></div>
            <div><dt>{ko ? '중앙 50%' : 'Middle half'}</dt><dd>{money.format(model.distribution.p25)}–{money.format(model.distribution.p75)}</dd></div>
            <div><dt>{ko ? '전체 범위' : 'Full range'}</dt><dd>{money.format(model.distribution.min)}–{money.format(model.distribution.max)}</dd></div>
            <div><dt>{ko ? '최근 계약 표본' : 'Retained sample'}</dt><dd>{ko ? `${model.coverage.retainedContracts}건` : `${model.coverage.retainedContracts} retained recent contracts`}</dd></div>
          </dl>
          <BoxPlot summary={model.distribution} axis={axis} formatValue={(value) => money.format(value)} locale={locale} />
        </section>
        <section className={styles.coverage} aria-labelledby="property-type-coverage">
          <div className={styles.sectionHeading}>
            <p>{ko ? '02 / 자료 범위와 한계' : '02 / Coverage boundary'}</p>
            <h2 id="property-type-coverage">{ko ? '이 페이지에 포함된 자료' : 'What this page does and does not cover'}</h2>
          </div>
          <p>{ko ? koreanCoverageNote(model) : model.evidence.coverageNote}</p>
          <dl className={styles.stats}>
            <div><dt>{ko ? '출처' : 'Source'}</dt><dd>{ko ? '국토교통부 신고 임대차 계약' : `${model.evidence.provider} ${model.evidence.dataset}`}</dd></div>
            <div><dt>{ko ? '자료 기간' : 'Declared period'}</dt><dd>{model.evidence.period}</dd></div>
            <div><dt>{ko ? '공개 기준 충족 건물' : 'Published buildings retained'}</dt><dd>{model.coverage.retainedBuildings}</dd></div>
            <div><dt>{ko ? '공개 최소 표본' : 'Publication minimum'}</dt><dd>{ko ? `${model.coverage.publicationMinimum}건` : `${model.coverage.publicationMinimum} contracts`}</dd></div>
          </dl>
        </section>
        <section className={styles.buildings} aria-labelledby="property-type-buildings">
          <div className={styles.sectionHeading}>
            <p>{ko ? '03 / 집계 건물' : '03 / Contributing buildings'}</p>
            <h2 id="property-type-buildings">{ko ? '공개 건물 실거래가' : 'Published building evidence used here'}</h2>
          </div>
          <ul>
            {model.buildings.map((building) => (
              <li key={building.id}>
                <a href={localizedSeoulHref(building.href, locale)}>
                  <strong>{building.name}</strong>
                  <span>{building.neighborhoodName} · {ko ? `최근 계약 ${building.sampleCount}건` : `${building.sampleCount} retained recent contracts`}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <nav className={styles.siblings} aria-label={ko ? '다른 공개 주택유형' : 'Other published property types'}>
          <a href={districtPath}>{ko ? `${model.district.nameKo} 전체 자료` : `All ${model.district.nameEn} evidence`}</a>
          {siblings.map((sibling) => (
            <a
              href={localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${sibling.slug}/`, locale)}
              key={sibling.slug}
            >
              {propertyTypeLabel(sibling, locale)}
            </a>
          ))}
          <Link href={localizedSeoulHref('/kr/seoul/check/', locale)}>{ko ? '계약 2건 비교' : 'Compare two contracts'}</Link>
          <Link href={localizedSeoulHref('/kr/seoul/rankings/', locale)}>{ko ? '지역 순위' : 'District rankings'}</Link>
        </nav>
      </main>
      <script
        type="application/ld+json"
        data-structured-data="dataset"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(datasetJsonLd(model, locale)) }}
      />
      <PublicBreadcrumbJsonLd items={[
        { name: ko ? '홈' : 'Home', path: ko ? '/ko/' : '/' },
        { name: ko ? '서울' : 'Seoul', path: localizedSeoulHref('/kr/seoul/', locale) as `/${string}` },
        { name: ko ? '탐색' : 'Explore', path: explorePath as `/${string}` },
        { name: ko ? model.district.nameKo : model.district.nameEn, path: districtPath as `/${string}` },
        { name: propertyTypeLabel(model.propertyType, locale), path: typePath },
      ]} />
      <SiteFooter copy={footerFor(locale)} />
    </div>
  );
}
