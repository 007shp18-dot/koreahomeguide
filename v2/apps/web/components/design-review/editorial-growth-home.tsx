import { HomeAnalysis } from '../home-analysis';
import Link from 'next/link';
import { UiIcon } from '../ui-icon';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import type { SiteLocale } from '@/lib/navigation/site-navigation';
import { createBuyingJourney } from '@/lib/home/buying-journey-model.server';
import Image from 'next/image';
import { BudgetHouseScene } from '../home/budget-house-scene';
import { HomeSearch } from '../home/home-search';
import { HomeReportPulse } from '../home/home-report-pulse';
import type { EditorialPortfolioRecord } from '@/content/portfolio-types';
import type { StoryPhoto } from '@/content/story-photos';
import { getPortfolioRecord } from '@/content/portfolio-manifest';
import { cityPhotoLabel } from '@/lib/content/article-photo';
import { homeArticlePhoto } from '@/lib/home/home-article-photo';
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
    src: '/assets/home/singapore-kevin-wang.jpg',
    caption: { en: 'Marina Bay and the Singapore skyline at dusk.', ko: '해 질 무렵 싱가포르 마리나 베이와 도심 풍경.' },
    source: 'https://unsplash.com/photos/an-aerial-view-of-a-city-at-night-A1fSrS-mIs4',
    author: 'Kevin Wang', license: 'Unsplash License', licenseHref: 'https://unsplash.com/license', portrait: true,
    place: 'Marina Bay', country: 'Singapore', position: '50% 60%',
  },
  'ae-dubai': {
    src: '/assets/home/dubai-waqas-sultan.jpg',
    caption: { en: 'Residential towers around Dubai Marina in daylight.', ko: '낮에 바라본 두바이 마리나의 주거 타워.' },
    source: 'https://unsplash.com/photos/high-rise-buildings-near-calm-water-at-daytime-eNFNHIcYizY',
    author: 'Waqas Sultan', license: 'Unsplash License', licenseHref: 'https://unsplash.com/license', portrait: false,
    place: 'Dubai Marina', country: 'United Arab Emirates', position: '50% 65%',
  },
  'jp-tokyo': {
    src: '/assets/home/tokyo-christian-macmillan.jpg',
    caption: { en: 'Tokyo Tower and the surrounding city.', ko: '도쿄 타워와 주변 도심 풍경.' },
    source: 'https://unsplash.com/photos/aerial-view-of-city-buildings-during-daytime-cMTWrbqcESs',
    author: 'Christian MacMillan', license: 'Unsplash License', licenseHref: 'https://unsplash.com/license', portrait: true,
    place: 'Tokyo Tower', country: 'Japan', position: '50% 40%',
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
  const featured = articles?.[0] ?? getPortfolioRecord(locale, 'seoul-apartment-buying-budget-guide') ?? getPortfolioRecord(locale, 'seoul-monthly-2026-09');
  const featurePhoto = featured ? homeArticlePhoto(featured) : undefined;
  const story = getPortfolioRecord(locale, 'tokyo-apartment-buying-budget-guide') ?? {
    canonicalHref: `${prefix}/jp/tokyo/explore/`,
    deck: locale === 'zh-CN' ? '按地区、面积与房龄比较季度成交，找到值得进一步了解的街区。' : 'Explore recorded prices by neighbourhood, size and building age.',
  };
  const storyPhoto = 'bodyMarkdown' in story ? homeArticlePhoto(story) : {src: CITY_PHOTOS['jp-tokyo'].src, portrait: true, context: 'city' as const};
  const creditRecords = articles?.slice(0, 3) ?? ['seoul', 'singapore', 'dubai'].flatMap(city => {
    const record = getPortfolioRecord(locale, `${city}-monthly-2026-09`);
    return record ? [record] : [];
  });
  const storyCredits = [...new Map([featurePhoto, storyPhoto, ...creditRecords.map(homeArticlePhoto)]
    .flatMap(photo => photo && 'credit' in photo && photo.credit ? [[photo.src, photo.credit] as const] : [])).values()];
  const text = locale === 'ko'
    ? { featured: '지금 읽을 이야기', read: '기사 읽기', story: '도쿄에서의 다음 선택', planner: '집값 다음의 숫자까지.', plannerBody: '매입비용부터 매달 드는 돈까지, 내 조건으로 비교해 보세요.', plannerAction: '내 예산 계산하기' }
    : locale === 'zh-CN'
      ? { featured: '精选阅读', read: '阅读文章', story: '在东京，下一步怎么选', planner: '房价之外，还有什么？', plannerBody: '从购置费用到每月支出，用自己的条件比较。', plannerAction: '计算我的预算' }
      : { featured: 'The latest perspective', read: 'Read the story', story: 'Your next move in Tokyo', planner: 'Beyond the asking price.', plannerBody: 'From buying costs to monthly expenses. Put your own numbers in perspective.', plannerAction: 'Plan my budget' };


  return <main className={styles.homePage} data-interface="research-first">
    <header className={`${styles.section} ${styles.hero}`}>
      <Image className={styles.heroBackground} src="/assets/home/seoul-ethan-brooke.jpg" alt="" fill preload sizes="100vw" style={{ objectFit: 'cover', objectPosition: '50% 58%' }} />
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>SIGNEDPRICE / FOUR CITIES. YOUR NEXT MOVE.</p>
        <h1>{copy.title}<span>{copy.titleEnd}</span></h1>
        <p className={styles.lead}>{copy.lead}</p>
        <HomeSearch locale={locale} />
        <Link className={styles.heroHint} href={`${prefix}/prices/`}>{copy.markets}<UiIcon name="arrow-right" /></Link>
      </div>
      {featured && featurePhoto && <article className={styles.heroStory}>
        <Link href={featured.canonicalHref} className={styles.heroStoryPhoto} tabIndex={-1} aria-hidden="true"><Image src={featurePhoto.src} alt={featurePhoto.alt ?? ""} unoptimized={!featurePhoto.src.startsWith("/assets/")} fill sizes="(max-width: 760px) 90px, 310px" style={{objectFit: featurePhoto.portrait ? 'contain' : 'cover'}} /></Link>
        <div>{featurePhoto.context === 'city' && <small data-photo-context="city">{cityPhotoLabel(locale)}</small>}<p className={styles.kicker}>{text.featured}</p><h2><Link href={featured.canonicalHref}>{featured.title}</Link></h2><Link className={styles.storyAction} href={featured.canonicalHref}>{text.read}<UiIcon name="arrow-right" /></Link></div>
      </article>}
      <span className={styles.photoCaption}>SEOUL / ETHAN BROOKE</span>
    </header>

    <section className={`${styles.section} ${styles.cities}`} aria-labelledby="home-cities-title" data-home-region="markets">
      <div className={styles.cityHeading}><h2 id="home-cities-title">{copy.index}</h2><span>{locale === 'ko' ? '도시를 선택해 실제 거래를 살펴보세요' : locale === 'zh-CN' ? '选择城市，查看真实成交' : 'Choose a city. Explore its recorded prices.'}</span></div>
      <div className={styles.cityGrid}>{models.map((model, index) => {
        const photo = CITY_PHOTOS[model.market as HomeMarket];
        return <article className={styles.cityCard} key={model.market} data-market-id={model.market}>
          <Link className={styles.cityLink} href={model.exploreHref} data-city-destination={model.city} data-primary-action="explore">
            <div className={styles.cityPhoto}><Image src={photo.src} alt={photo.caption[locale === 'ko' ? 'ko' : 'en']} fill sizes="(max-width: 760px) 48px, 70px" style={{ objectFit: 'cover', objectPosition: photo.position }} /></div>
            <div className={styles.cityLabel}><span className={styles.cityNumber}>0{index + 1}</span><h3>{model.name}</h3><span>{model.currency}</span><UiIcon name="arrow-right" /></div>
          </Link>
          <Link className={styles.cityGuide} href={model.guideHref}>{copy.budgetGuide}<UiIcon name="arrow-right" /></Link>
        </article>;
      })}</div>
    </section>

    <div className={`${styles.section} ${styles.researchGrid}`}>
      <HomeReportPulse locale={locale} />
      {story && storyPhoto && <article className={styles.featureStory}>
        <Link href={story.canonicalHref} className={styles.featureStoryPhoto} tabIndex={-1} aria-hidden="true"><Image src={storyPhoto.src} alt="" unoptimized={!storyPhoto.src.startsWith("/assets/")} fill sizes="(max-width: 760px) 100vw, 25vw" style={{objectFit: storyPhoto.portrait ? 'contain' : 'cover'}} /></Link>
        <div><p className={styles.kicker}>TOKYO / {copy.guides}</p><h2><Link href={story.canonicalHref}>{text.story}</Link></h2><p>{story.deck}</p><Link className={styles.storyAction} href={story.canonicalHref}>{copy.budgetGuide}<UiIcon name="arrow-right" /></Link></div>
      </article>}
      <aside className={styles.planning}>
        <p className={styles.kicker}>{copy.tools}</p>
        <BudgetHouseScene locale={locale} />
        <h2>{text.planner}</h2>
        <p>{text.plannerBody}</p>
        <Link href={`${prefix}/tools/property-scenario/`}>{text.plannerAction}<UiIcon name="arrow-right" /></Link>
        <Link className={styles.planningSecondary} href={`${prefix}/tools/`}>{copy.tools}<UiIcon name="arrow-right" /></Link>
      </aside>
    </div>

    <HomeAnalysis locale={locale} articles={articles} />

    <div className={`${styles.section} ${styles.sources}`}>
      <div className={styles.sourceLinks}><Link href={`${prefix}/guides/`}>{copy.guides}<UiIcon name="arrow-right" /></Link><Link href="/trust/">{copy.methodology} <UiIcon name="arrow-right" /></Link></div>
      <details className={styles.credits}>
        <summary>{copy.credits}<UiIcon name="chevron-down" /></summary>
        <p>{copy.modifications}</p>
        <ul><li><a href="https://unsplash.com/photos/a-view-of-a-city-at-night-from-a-bridge-E0awymZfM1k" target="_blank" rel="noopener noreferrer">Seoul — Ethan Brooke / Unsplash</a> · <a href="https://unsplash.com/license">Unsplash License</a></li>{markets.map(({ id }) => {
          const photo = CITY_PHOTOS[id];
          return <li key={id} data-photo-credit={id}>{copy.cities[id]} — <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author} / Unsplash</a> · <a href={photo.licenseHref} target="_blank" rel="noopener noreferrer">{photo.license}</a></li>;
        })}{storyCredits.map(credit => <li key={credit.source}><a href={credit.source} target="_blank" rel="noopener noreferrer">{credit.author}</a>{credit.license && <> · <a href={credit.licenseHref} target="_blank" rel="noopener noreferrer">{credit.license}</a></>}</li>)}</ul>
      </details>
    </div>
  </main>;
}
