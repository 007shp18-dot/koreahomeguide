import { HomeAnalysis } from '../home-analysis';
import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import { createBuyingJourney } from '@/lib/home/buying-journey-model.server';
import Image from 'next/image';
import { HomeSearch } from '../home/home-search';
import { HomeReportPulse } from '../home/home-report-pulse';
import type { EditorialPortfolioRecord } from '@/content/portfolio-types';
import type { StoryPhoto } from '@/content/story-photos';
import styles from './editorial-growth-home.module.css';

const COPY = {
  en: {
    title: 'Find your place.', titleEnd: 'Know its price.',
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
    title: '살고 싶은 곳,', titleEnd: '거래부터 알아보세요.',
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
    title: '找到心仪的家，', titleEnd: '先了解真实成交。',
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
    place: 'Clarke Quay', country: 'Singapore', position: '50% 60%',
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

export function PropertyHome({ locale, articles }: Readonly<{ locale: SiteLocale; articles?: readonly EditorialPortfolioRecord[] }>) {
  const copy = COPY[locale];
  const prefix = locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : '';
  const models = createBuyingJourney(locale);
  const markets = models.map(model => ({ id: model.market as HomeMarket }));

  return <main className={styles.homePage} data-interface="research-first">
    <header className={`${styles.section} ${styles.hero}`}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>SIGNEDPRICE / SEOUL · SINGAPORE · DUBAI · TOKYO</p>
        <h1>{copy.title}<span>{copy.titleEnd}</span></h1>
        <p className={styles.lead}>{copy.lead}</p>
        <HomeSearch locale={locale} />
        <Link className={styles.heroHint} href={`${prefix}/prices/`}>{copy.markets}<UiIcon name="arrow-right" /></Link>
      </div>
      <div className={styles.heroVisual}>
        <Image src={CITY_PHOTOS['kr-seoul'].src} alt={CITY_PHOTOS['kr-seoul'].caption[locale === 'ko' ? 'ko' : 'en']} fill priority sizes="(max-width: 760px) 100vw, 45vw" style={{ objectFit: 'cover', objectPosition: '50% 72%' }} />
        <span className={styles.photoCaption}>SEOUL / YEOUIDO</span>
      </div>
    </header>

    <section className={`${styles.section} ${styles.cities}`} aria-labelledby="home-cities-title" data-home-region="markets">
      <div className={styles.cityHeading}><h2 id="home-cities-title">{copy.index}</h2><span>{locale === 'ko' ? '도시를 선택해 실제 거래를 살펴보세요' : locale === 'zh-CN' ? '选择城市，查看真实成交' : 'Choose a city. Explore its recorded prices.'}</span></div>
      <div className={styles.cityGrid}>{models.map((model, index) => {
        const photo = CITY_PHOTOS[model.market as HomeMarket];
        return <article className={styles.cityCard} key={model.market} data-market-id={model.market}>
          <Link className={styles.cityLink} href={model.exploreHref} data-city-destination={model.city} data-primary-action="explore">
            <div className={styles.cityPhoto}><Image src={photo.src} alt={photo.caption[locale === 'ko' ? 'ko' : 'en']} fill sizes="(max-width: 760px) 45vw, 23vw" style={{ objectFit: 'cover', objectPosition: photo.position }} /></div>
            <div className={styles.cityLabel}><span className={styles.cityNumber}>0{index + 1}</span><h3>{model.name}</h3><span>{model.currency}</span><UiIcon name="arrow-right" /></div>
          </Link>
          <Link className={styles.cityGuide} href={model.guideHref}>{copy.budgetGuide}<UiIcon name="arrow-right" /></Link>
        </article>;
      })}</div>
    </section>

    <HomeAnalysis locale={locale} articles={articles} />

    <div className={`${styles.section} ${styles.researchGrid}`}>
      <HomeReportPulse locale={locale} />
      <aside className={styles.planning}>
        <p className={styles.kicker}>{copy.tools}</p>
        <svg className={styles.house} viewBox="0 0 180 130" fill="none" aria-hidden="true"><path d="M24 61 88 16l69 44v54H24Z" fill="#fff" fillOpacity=".14"/><path d="m24 61 64-45 69 44M42 49v65h97V49M77 114V77h30v37M52 64h15v18H52Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/><path d="m88 16 51 33M107 77l16 10v27" stroke="white" strokeOpacity=".5" strokeWidth="2"/></svg>
        <h2>{copy.toolsNote}</h2>
        <p>{locale === 'ko' ? '집값과 취득·보유 비용을 한곳에서 비교하세요.' : locale === 'zh-CN' ? '一起比较房价、购置费用与持有成本。' : 'Bring the price, buying costs and ongoing expenses into one view.'}</p>
        <Link href={`${prefix}/tools/`}>{copy.tools}<UiIcon name="arrow-right" /></Link>
        <Link className={styles.planningSecondary} href={`${prefix}/guides/`}>{copy.guides}<UiIcon name="arrow-right" /></Link>
      </aside>
    </div>

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
