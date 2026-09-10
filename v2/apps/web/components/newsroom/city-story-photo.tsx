import Image from 'next/image';
import { STORY_PHOTOS } from '../../content/story-photos';
import type { StoryCity, StoryLocale } from '../../content/city-stories';
import { MARKET_PHOTOS } from '../market-representative-photo';
import styles from './newsroom-journey.module.css';

export function CityStoryPhoto({ city, locale = 'en', forest = false, eager = false, scene }: Readonly<{ city: StoryCity; locale?: StoryLocale; forest?: boolean; eager?: boolean; scene?: 'neighborhood' | 'comparison' }>) {
  const inlinePhoto = scene ? STORY_PHOTOS[city]?.[scene] : undefined;
  if (inlinePhoto) return <figure className={`${styles.photo} ${inlinePhoto.portrait ? styles.portraitPhoto : ''}`}>
    <div><Image src={inlinePhoto.src} alt={inlinePhoto.caption[locale]} fill sizes="(max-width: 740px) calc(100vw - 32px), 720px" style={{ objectFit: inlinePhoto.portrait ? 'contain' : 'cover' }} /></div>
    <figcaption>{inlinePhoto.caption[locale]} <span>· <a href={inlinePhoto.source} target="_blank" rel="noopener noreferrer">{inlinePhoto.author} / Wikimedia Commons</a> · <a href={inlinePhoto.licenseHref} target="_blank" rel="noopener noreferrer">{inlinePhoto.license}</a></span></figcaption>
  </figure>;
  const seoul = city === 'seoul';
  const photo = MARKET_PHOTOS[city];
  const caption = seoul
    ? forest ? (locale === 'ko' ? '서울숲의 산책로' : 'A boardwalk in Seoul Forest') : (locale === 'ko' ? '성수동의 저녁 거리' : 'An evening street in Seongsu-dong')
    : ({ singapore: { en: 'Singapore', ko: '싱가포르' }, dubai: { en: 'Dubai', ko: '두바이' }, tokyo: { en: 'Tokyo', ko: '도쿄' } } as const)[city as Exclude<StoryCity, 'seoul'>][locale];
  return <figure className={styles.photo}>
    <div><Image src={seoul ? `/assets/stories/${forest ? 'seoul-forest-boardwalk' : 'seongsu-evening-street'}.jpg` : photo.src} alt={seoul ? caption : photo.alt} fill priority={eager} sizes="(max-width: 740px) 100vw, 800px" style={{ objectPosition: `${photo.focalPoint.x}% ${photo.focalPoint.y}%` }} /></div>
    <figcaption>{caption}{seoul && <> · <a href={`https://commons.wikimedia.org/wiki/File:${forest ? 'Seoul_Forest_boardwalk_with_tables' : 'Evening_street_in_Seongsu-dong'}.jpg`} target="_blank" rel="noopener noreferrer">CartoonChess / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></>}</figcaption>
  </figure>;
}
