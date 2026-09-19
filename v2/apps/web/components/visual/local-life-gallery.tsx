import Image from 'next/image';
import Link from 'next/link';
import { listNeighbourhoodStories, neighbourhoodHref } from '../../content/neighbourhood-stories';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import type { BuyingCity } from '../../lib/home/buying-journey';
import styles from './visual-panels.module.css';

export function LocalLifeGallery({ city, locale }: { city: BuyingCity; locale: SiteLocale }) {
  const storyLocale = locale === 'ko' ? 'ko' : 'en';
  const stories = listNeighbourhoodStories(city, storyLocale).filter(story => !story.photosWithheld).slice(0, 3);
  if (!stories.length) return null;
  return <section className={styles.localLife} data-local-life={city}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>NEIGHBOURHOOD NOTEBOOK</p><h2>{locale === 'ko' ? '살아보고 싶은 동네 가까이' : locale === 'zh-CN' ? '走近社区生活' : 'A little closer to local life'}</h2><p>{locale === 'ko' ? '가격을 살펴본 뒤, 그 동네의 일상도 알아보세요.' : locale === 'zh-CN' ? '了解价格之后，继续探索社区的日常生活。以下文章为英文。' : 'Go beyond the price and explore the everyday neighbourhood.'}</p></div></header>
    <div className={styles.lifeCards}>{stories.map(story => <article key={story.slug}>
      <Link href={neighbourhoodHref(story.slug, storyLocale)} className={styles.lifePhoto} aria-label={story.title}><Image src={story.hero.src} alt={story.hero.alt} fill sizes="(max-width:700px) 90vw, 40vw" style={{ objectFit: 'cover' }}/></Link>
      <div><p>{story.neighbourhood}{locale === 'zh-CN' ? ' · English' : ''}</p><h3><Link href={neighbourhoodHref(story.slug, storyLocale)}>{story.title}</Link></h3><p>{story.deck}</p></div>
      <details className={styles.lifeCredit}><summary>{locale === 'ko' ? '사진 출처' : locale === 'zh-CN' ? '图片来源' : 'Photo credit'}</summary><a href={story.hero.source} target="_blank" rel="noopener noreferrer">{story.hero.author}</a> · <a href={story.hero.licenseUrl} target="_blank" rel="noopener noreferrer">{story.hero.license}</a><p>{locale === 'ko' ? '화면 비율에 맞춰 크롭했습니다.' : locale === 'zh-CN' ? '图片按展示比例裁剪。' : 'Cropped to fit the display.'}</p></details>
    </article>)}</div>
  </section>;
}
