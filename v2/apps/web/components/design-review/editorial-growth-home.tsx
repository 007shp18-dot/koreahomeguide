import { HomeAnalysis } from '../home-analysis';
import Link from 'next/link';
import Image from 'next/image';
import { HomeSearch } from '../home/home-search';
import { UiIcon } from '../ui-icon';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import { createBuyingJourney } from '@/lib/home/buying-journey-model.server';
import { BuyingJourney } from '../home/buying-journey';
import type { StoryPhoto } from '@/content/story-photos';
import styles from './editorial-growth-home.module.css';

const COPY = {
  en: {
    title: 'What can your budget buy?', titleEnd: 'Four cities. Your next move.',
    lead: 'Compare recorded home sales, understand buying costs, and narrow your search.',
    markets: 'Choose a city', explore: 'Explore', index: 'The city index',
    next: 'Take a closer look', tools: 'Tools', toolsNote: 'Budgets & buying costs',
    insights: 'Insights', insightsNote: 'Stories behind the numbers',
    guides: 'Guides', guidesNote: 'Buying & renting, explained',
    credits: 'Photography & sources', modifications: 'Photographs are resized and cropped. Some files are converted to WebP. Image adaptations retain the linked licenses. These are location photographs, not property listings or current market evidence.',
    methodology: 'How we use property data', budgetGuide: 'Buying budget guide',
    cities: { 'kr-seoul': 'Seoul', 'sg-singapore': 'Singapore', 'ae-dubai': 'Dubai', 'jp-tokyo': 'Tokyo' },
  },
  ko: {
    title: '내 예산으로 어떤 집을?', titleEnd: '네 도시에서 찾는 다음 선택.',
    lead: '실제 거래와 구매비용을 비교하며, 나에게 맞는 선택지를 좁혀보세요.',
    markets: '도시 선택', explore: '탐색', index: '도시 둘러보기',
    next: '조금 더 자세히', tools: '도구', toolsNote: '예산 비교와 매입 비용',
    insights: '인사이트', insightsNote: '숫자로 읽는 시장 이야기',
    guides: '가이드', guidesNote: '매입과 임대, 하나씩 알아보기',
    credits: '사진·출처', modifications: '사진은 크기 조정과 크롭을 적용했으며 일부는 WebP로 변환했습니다. 편집한 사진에도 링크된 라이선스가 유지됩니다. 장소를 소개하는 사진이며 현재 매물이나 최신 시장 상황을 보여주는 자료는 아닙니다.',
    methodology: '부동산 데이터 활용 방법', budgetGuide: '예산별 구매 가이드',
    cities: { 'kr-seoul': '서울', 'sg-singapore': '싱가포르', 'ae-dubai': '두바이', 'jp-tokyo': '도쿄' },
  },
  'zh-CN': {
    title: '你的预算，能买怎样的家？', titleEnd: '四座城市，下一步由你选择。',
    lead: '比较真实成交，了解购房成本，逐步缩小选择范围。',
    markets: '选择城市', explore: '探索', index: '城市索引',
    next: '进一步了解', tools: '工具', toolsNote: '预算比较与购房成本',
    insights: '洞察', insightsNote: '数字背后的市场故事',
    guides: '指南', guidesNote: '了解购房与租房流程',
    credits: '摄影与来源', modifications: '照片经过缩放和裁剪，部分转换为 WebP。修改后的图片保留链接中的许可。这些照片用于介绍地点，并非在售房源或当前市场资料。',
    methodology: '我们如何使用房地产数据', budgetGuide: '购房预算指南',
    cities: { 'kr-seoul': '首尔', 'sg-singapore': '新加坡', 'ae-dubai': '迪拜', 'jp-tokyo': '东京' },
  },
} as const;

type HomeMarket = keyof typeof COPY.en.cities;
const CITY_PHOTOS: Readonly<Record<HomeMarket, StoryPhoto & { place: string; country: string; position: string }>> = {
  'kr-seoul': {
    src: '/assets/home/seoul-ethan-yoo.jpg',
    caption: { en: 'The Yeouido skyline across the Han River, Seoul.', ko: '한강 너머로 바라본 서울 여의도.' },
    source: 'https://unsplash.com/photos/a-view-of-a-city-from-across-the-water-VxNtrcbKKqQ',
    author: 'Ethan Yoo', license: 'Unsplash License',
    licenseHref: 'https://unsplash.com/license', portrait: false,
    place: 'Yeouido', country: 'South Korea', position: '50% 75%',
  },
  'sg-singapore': {
    src: '/assets/home/singapore-filipe-freitas.jpg',
    caption: { en: 'Clarke Quay rooftops and the Singapore skyline.', ko: '싱가포르 클라크 키의 지붕과 도심 풍경.' },
    source: 'https://unsplash.com/photos/a-city-with-a-lot-of-tall-buildings-next-to-a-body-of-water-9nDDPLZM670',
    author: 'Filipe Freitas', license: 'Unsplash License', licenseHref: 'https://unsplash.com/license', portrait: true,
    place: 'Clarke Quay', country: 'Singapore', position: '50% 0%',
  },
  'ae-dubai': {
    src: '/assets/home/dubai-waqas-sultan.jpg',
    caption: { en: 'Residential towers around Dubai Marina in daylight.', ko: '낮에 바라본 두바이 마리나의 주거 타워.' },
    source: 'https://unsplash.com/photos/high-rise-buildings-near-calm-water-at-daytime-eNFNHIcYizY',
    author: 'Waqas Sultan', license: 'Unsplash License', licenseHref: 'https://unsplash.com/license', portrait: false,
    place: 'Dubai Marina', country: 'United Arab Emirates', position: '50% 65%',
  },
  'jp-tokyo': {
    src: '/assets/home/tokyo-pjh.jpg',
    caption: { en: 'Tokyo rooftops and the NTT Docomo Yoyogi Building.', ko: '도쿄의 지붕들과 NTT 도코모 요요기 빌딩.' },
    source: 'https://unsplash.com/photos/clear-blue-sky-over-a-city-skyline-with-buildings-tHMtWd_trtI',
    author: 'PJH', license: 'Unsplash License', licenseHref: 'https://unsplash.com/license', portrait: true,
    place: 'Yoyogi', country: 'Japan', position: '50% 100%',
  },
};

export function EditorialGrowthHome({ model }: Readonly<{
  model: Pick<EditorialGrowthReviewModel, 'locale'>;
  hrefs?: Readonly<{ content: string; check: string; explore: string }>;
}>) {
  return <PropertyHome locale={model.locale} />;
}

export function PropertyHome({ locale }: Readonly<{ locale: SiteLocale }>) {
  const copy = COPY[locale];
  const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
  const models = createBuyingJourney(locale);
  const markets = models.map(model => ({ id: model.market as HomeMarket }));

  return <main className={styles.homePage} data-interface-page="home">
    <header className={`${styles.section} ${styles.hero}`}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>PRICES GROUNDED IN SIGNED CONTRACTS.</p>
        <h1>{copy.title}<span>{copy.titleEnd}</span></h1>
        <p className={styles.lead}>{copy.lead}</p>
        <div data-home-search="true"><HomeSearch locale={locale} /></div>
        <ul className={styles.trustPoints}>{(locale === 'ko'
          ? ['거래 기간·범위 공개', '공식 자료 기반', '호가가 아닌 과거 거래']
          : locale === 'zh-CN' ? ['明确的成交时期与范围', '官方资料来源', '历史成交，并非挂牌价']
          : ['Dates and coverage shown', 'Official sources', 'Recorded sales, not asking prices']).map(point => <li key={point}>{point}</li>)}</ul>
      </div>
      <div className={styles.heroVisual} data-home-city-mosaic="true">
        {markets.map(({ id }, index) => <figure key={id} className={styles.heroCity}>
          <Image src={CITY_PHOTOS[id].src} alt={locale === 'ko' ? CITY_PHOTOS[id].caption.ko : CITY_PHOTOS[id].caption.en}
            fill sizes="(max-width: 700px) 25vw, (max-width: 1000px) 24vw, 13vw"
            preload={index === 0} style={{ objectFit: 'cover', objectPosition: CITY_PHOTOS[id].position }} />
          <figcaption><span>{String(index + 1).padStart(2, '0')}</span><strong>{copy.cities[id]}</strong></figcaption>
        </figure>)}
      </div>
    </header>

    <BuyingJourney models={models} photos={CITY_PHOTOS} locale={locale} />

    <HomeAnalysis locale={locale} photos={markets.slice(0, 3).map(({ id }) => ({ src: CITY_PHOTOS[id].src, alt: locale === 'ko' ? CITY_PHOTOS[id].caption.ko : CITY_PHOTOS[id].caption.en }))} />

    <nav className={`${styles.section} ${styles.directory}`} aria-label={copy.next}>
      <p className={styles.kicker}>{copy.next}</p>
      <div className={styles.directoryLinks}>
        {[
          { href: `${prefix}/tools/`, title: copy.tools, note: copy.toolsNote },
          { href: `${prefix}/news/`, title: copy.insights, note: copy.insightsNote },
          { href: `${prefix}/guides/`, title: copy.guides, note: copy.guidesNote },
        ].map(item => <Link key={item.href} href={item.href}>
          <span className={styles.directoryTitle}>{item.title}</span><span className={styles.directoryNote}>{item.note}</span><UiIcon name="arrow-right" />
        </Link>)}
      </div>
    </nav>

    <div className={`${styles.section} ${styles.sources}`}>
      <Link href="/trust/">{copy.methodology} <UiIcon name="arrow-right" /></Link>
      <details className={styles.credits}>
        <summary>{copy.credits}<UiIcon name="chevron-down" /></summary>
        <p>{copy.modifications}</p>
        <ul>{markets.map(({ id }) => {
          const photo = CITY_PHOTOS[id];
          return <li key={id} data-photo-credit={id}>{copy.cities[id]} — <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author} / Unsplash</a> · <a href={photo.licenseHref} target="_blank" rel="noopener noreferrer">{photo.license}</a></li>;
        })}</ul>
      </details>
    </div>
  </main>;
}
