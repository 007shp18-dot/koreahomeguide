import Image from 'next/image';
import { ExploreLink } from '../market-ui/explore-link';
import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import { createThreeMarketHomeModel } from '@/lib/home/three-market-home-model';
import type { StoryPhoto } from '@/content/story-photos';
import styles from './editorial-growth-home.module.css';

const COPY = {
  en: {
    title: 'Four cities.', titleEnd: 'Many ways to live.',
    lead: 'Choose a city. Explore recorded prices, neighbourhoods and buying costs.',
    markets: 'Choose a city', explore: 'Explore', index: 'The city index',
    next: 'Take a closer look', tools: 'Tools', toolsNote: 'Budgets & buying costs',
    insights: 'Insights', insightsNote: 'Stories behind the numbers',
    guides: 'Guides', guidesNote: 'Buying & renting, explained',
    credits: 'Photography & sources', modifications: 'Photographs are resized and cropped. Some files are converted to WebP. Image adaptations retain the linked licenses. These are location photographs, not property listings or current market evidence.',
    methodology: 'How we use property data',
    cities: { 'kr-seoul': 'Seoul', 'sg-singapore': 'Singapore', 'ae-dubai': 'Dubai', 'jp-tokyo': 'Tokyo' },
  },
  ko: {
    title: '네 개의 도시,', titleEnd: '저마다의 생활.',
    lead: '도시를 고르고, 실제 거래 가격과 동네·구매 비용을 살펴보세요.',
    markets: '도시 선택', explore: '탐색', index: '도시 둘러보기',
    next: '조금 더 자세히', tools: '도구', toolsNote: '예산 비교와 매입 비용',
    insights: '인사이트', insightsNote: '숫자로 읽는 시장 이야기',
    guides: '가이드', guidesNote: '매입과 임대, 하나씩 알아보기',
    credits: '사진·출처', modifications: '사진은 크기 조정과 크롭을 적용했으며 일부는 WebP로 변환했습니다. 편집한 사진에도 링크된 라이선스가 유지됩니다. 장소를 소개하는 사진이며 현재 매물이나 최신 시장 상황을 보여주는 자료는 아닙니다.',
    methodology: '부동산 데이터 활용 방법',
    cities: { 'kr-seoul': '서울', 'sg-singapore': '싱가포르', 'ae-dubai': '두바이', 'jp-tokyo': '도쿄' },
  },
  'zh-CN': {
    title: '四座城市，', titleEnd: '不同的生活。',
    lead: '选择城市，了解真实成交价格、街区与购房成本。',
    markets: '选择城市', explore: '探索', index: '城市索引',
    next: '进一步了解', tools: '工具', toolsNote: '预算比较与购房成本',
    insights: '洞察', insightsNote: '数字背后的市场故事',
    guides: '指南', guidesNote: '了解购房与租房流程',
    credits: '摄影与来源', modifications: '照片经过缩放和裁剪，部分转换为 WebP。修改后的图片保留链接中的许可。这些照片用于介绍地点，并非在售房源或当前市场资料。',
    methodology: '我们如何使用房地产数据',
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
  const markets = createThreeMarketHomeModel({ locale: locale === 'zh-CN' ? locale : 'en', seoulMetric: null }).markets;

  return <main className={styles.homePage}>
    <header className={`${styles.section} ${styles.hero}`}>
      <div>
        <p className={styles.kicker}>Signedprice / {copy.index}</p>
        <h1>{copy.title}<span>{copy.titleEnd}</span></h1>
      </div>
      <p className={styles.lead}>{copy.lead}</p>
    </header>

    <section className={styles.section} data-home-region="markets" aria-label={copy.markets}>
      <nav className={styles.cityIndex} aria-label={copy.markets}>
        {markets.map(market => <ExploreLink key={market.id} href={`${prefix}${market.primaryAction.href}`}>
          <span>{market.position}</span>{copy.cities[market.id]}
          <UiIcon name="arrow-right" />
        </ExploreLink>)}
      </nav>
      <ol className={styles.marketGrid}>
        {markets.map((market, index) => {
          const city = copy.cities[market.id];
          const photo = CITY_PHOTOS[market.id];
          const href = `${prefix}${market.primaryAction.href}`;
          return <li className={styles.marketCard} key={market.id} id={`city-${market.id}`} data-market-id={market.id} data-contextual-action={market.id}>
            <ExploreLink href={href} className={styles.cityLink} data-primary-action="explore" aria-label={`${copy.explore} ${city}`}>
              <div className={styles.photo}>
                <Image src={photo.src} alt={photo.caption[locale === 'ko' ? 'ko' : 'en']} fill
                  loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'}
                  sizes={index % 2 === 0 ? '(max-width: 700px) calc(100vw - 40px), (max-width: 1392px) 60vw, 780px' : '(max-width: 700px) calc(100vw - 40px), (max-width: 1392px) 34vw, 440px'}
                  style={{ objectPosition: photo.position }} />
              </div>
              <div className={styles.marketBody}>
                <div><p className={styles.country}>{market.position} / {photo.country}</p><h2>{city}</h2></div>
                <span className={styles.cityArrow}><UiIcon name="arrow-right" /></span>
              </div>
              <p className={styles.place}>{photo.place}<span>{copy.explore} <UiIcon name="arrow-right" /></span></p>
            </ExploreLink>
          </li>;
        })}
      </ol>
    </section>

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
