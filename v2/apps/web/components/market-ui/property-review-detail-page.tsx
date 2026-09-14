import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '../../lib/site-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import { indexableMetadata } from '../../lib/public-metadata';
import { actualDetailHref, reviewLocation } from '../../lib/research/property-review-locations';
import { propertyReviewProfile, propertyReviewProfilesForMarket, type ReviewedPropertyProfile } from '../../lib/research/property-review-profile';
import { LivingContextCard } from './living-context';
import { MarketDetailShell } from './market-shell';
import { RecordPlaceVisit } from '../discovery/recent-places';
import styles from './property-review-detail.module.css';

export type NamedPropertyMarket = 'jp-tokyo' | 'ae-dubai';
export type NamedPropertyPageProps = Readonly<{ params: Promise<Readonly<{ profileId: string }>> }>;

export function namedPropertyStaticParams(market: NamedPropertyMarket) {
  return propertyReviewProfilesForMarket(market).map(profile => ({ profileId: profile.id }));
}

export function namedPropertyProfile(market: NamedPropertyMarket, profileId: string) {
  const profile = propertyReviewProfile(profileId);
  return profile?.market_id === market && reviewLocation(profile.id) ? profile : null;
}

export function namedPropertyMetadata(locale: MarketLocale, market: NamedPropertyMarket, profileId: string): Metadata {
  const profile = namedPropertyProfile(market, profileId);
  const path = actualDetailHref(locale, profileId);
  if (!profile || !path) return { title: 'Property details | SignedPrice', robots: { index: false, follow: true } };
  const lang = locale === 'ko' ? 'ko' : 'en';
  const metadata = indexableMetadata({
    path: path as `/${string}`,
    title: `${profile.review.name[lang]} · ${lang === 'ko' ? '단지 정보와 입지 분석' : 'Property details & location'} | SignedPrice`,
    description: profile.review.verdict[lang],
    locale: locale === 'ko' ? 'ko_KR' : locale === 'zh-CN' ? 'zh_CN' : 'en_US',
    languageAlternates: {
      en: actualDetailHref('en', profileId) as `/${string}`,
      ko: actualDetailHref('ko', profileId) as `/${string}`,
    },
  });
  return locale === 'zh-CN' ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export function PropertyReviewDetailPage({ profile, locale = 'en' }: Readonly<{
  profile: ReviewedPropertyProfile;
  locale?: MarketLocale;
}>) {
  const review = profile.review;
  const location = reviewLocation(profile.id)!;
  const tokyo = profile.market_id === 'jp-tokyo';
  const lang = locale === 'ko' ? 'ko' : 'en';
  const t = (ko: string, en: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
  const city = tokyo ? t('도쿄', 'Tokyo', '东京') : t('두바이', 'Dubai', '迪拜');
  const explorePath = tokyo ? '/jp/tokyo/explore/' : '/ae/dubai/explore/';
  const detailHref = actualDetailHref(locale, profile.id)!;
  const stage = location.projectId?.endsWith('-off-plan') || profile.id === 'ae-skyflame-1'
    ? 'off-plan' : location.projectId?.endsWith('-ready') ? 'ready' : null;
  const query = new URLSearchParams();
  if (tokyo && location.wardCode) query.set('city', location.wardCode);
  if (!tokyo && stage) query.set('stage', stage);
  if (!tokyo && location.projectId && location.areaSlug) query.set('area', location.areaSlug);
  if (!tokyo && location.projectId) query.set('project', location.projectId);
  const contextHref = marketHref(locale, `${explorePath}?${query}`);
  const address = locale === 'ko' || !/[\uac00-\ud7af]/u.test(location.address) ? location.address : review.area.en;
  const scope = tokyo
    ? t('일본 국토교통성 공개 실거래는 건물명을 제공하지 않습니다. 주변 지역 거래는 비교 맥락으로 확인하며, 이 단지의 실거래로 표시하지 않습니다.', 'MLIT publishes transactions without building names. Nearby area records provide context; they have not been matched to this property.', '日本国土交通省公开成交不提供楼盘名称。周边地区成交仅用于区位比较，尚未匹配到本项目。')
    : location.projectId
      ? t('공개 DLD 프로젝트 집계와 입지 분석을 함께 확인할 수 있습니다. 프로젝트 거래 중앙값은 면적·층·조망을 맞춘 개별 세대 가격이 아닙니다.', 'Published DLD project aggregates accompany the location analysis. A project median covers different unit sizes, floors and outlooks.', '可结合 DLD 项目成交汇总与区位分析判断；项目中位数涵盖不同面积、楼层及景观的住宅。')
      : profile.id === 'ae-skyflame-1'
        ? t('개발사의 Skyflame 프로젝트군을 분석합니다. 타워 1과 DLD 등록번호의 정확한 연결은 확인되지 않아, 타워 1의 실거래 집계를 제시하지 않습니다.', 'This profile covers the developer’s Skyflame project group. The exact Tower 1 to DLD registration mapping is unverified, so no Tower 1 transaction aggregate is shown.', '本页分析开发商的 Skyflame 项目群。Tower 1 与 DLD 注册编号的准确对应尚未核实，因此不展示 Tower 1 成交汇总。')
        : t('이 단지와 DLD 프로젝트 거래의 정확한 연결은 아직 확인되지 않았습니다. 주변 지역 거래는 별도로 확인하며, 단지 실거래 집계로 제시하지 않습니다.', 'An exact match between this property and a published DLD project cohort has not been verified. Area transaction records remain available separately.', '本项目与已发布 DLD 成交组的准确对应尚未核实，周边区域成交另行展示。');
  return <>
    <SiteHeader copy={{ ...homepageCopy.header, marketLabel: city, languageLabel: locale === 'ko' ? 'KO' : locale === 'zh-CN' ? 'ZH' : 'EN', homeHref: marketHref(locale, '/'), links: [{ label: 'Explore', href: detailHref, isCurrent: true }] }} />
    <main data-named-property-detail={profile.id}>
      <RecordPlaceVisit place={{ market: tokyo ? 'tokyo' : 'dubai', key: profile.id, name: review.name[lang], href: detailHref }} />
      <MarketDetailShell locale={locale}
        breadcrumb={<Link href={marketHref(locale, explorePath)}>{city} · Explore</Link>}
        sections={[
          { id: 'detail-overview', label: t('단지 정보', 'Property details', '项目资料') },
          { id: 'property-review', label: t('단지 분석', 'Property analysis', '项目分析') },
        ]}
        summary={<header className={styles.identity}>
          <p className={styles.meta}>{city} · {tokyo ? t('주거 단지', 'Residential property', '住宅项目') : stage === 'off-plan' ? t('분양 예정·건설 중 프로젝트', 'Off-plan project', '期房项目') : stage === 'ready' ? t('준공 단지', 'Completed property', '已竣工项目') : t('주거 프로젝트', 'Residential project', '住宅项目')}</p>
          <h1>{review.name[lang]}</h1>
          <p>{address}</p>
          <nav aria-label={t('단지 탐색', 'Property exploration', '项目探索')}>
            <a href="#property-review">{t('단지 분석', 'Property analysis', '项目分析')}</a>
            <Link href={contextHref}>{tokyo ? t('주변 구의 실거래·지도', 'Ward transactions & map', '周边行政区成交与地图') : location.projectId ? t('이 프로젝트의 거래 요약', 'Project transaction summary', '本项目成交摘要') : t('두바이 실거래·지도', 'Dubai transactions & map', '迪拜成交与地图')}</Link>
          </nav>
        </header>}
        evidence={<section id="property-review" aria-label={t('단지 분석', 'Property analysis', '项目分析')}>
          <LivingContextCard profile={profile} locale={locale} embedded />
        </section>}
        rail={<section className={styles.scope}><h2>{t('가격 자료의 범위', 'Price coverage', '价格资料范围')}</h2><p>{scope}</p></section>}
      />
    </main>
    <SiteFooter locale={locale} copy={homepageCopy.footer} />
  </>;
}
