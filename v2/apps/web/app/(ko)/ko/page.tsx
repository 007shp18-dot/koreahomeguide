import Image from 'next/image';
import Link from 'next/link';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { PassportEntry } from '@/components/passport/passport-entry';
import { MARKET_PHOTOS } from '@/components/market-representative-photo';
import styles from '@/components/design-review/editorial-growth-home.module.css';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/ko/', title: '서울·싱가포르·두바이 부동산 실거래 비교 | SignedPrice', description: '서울·싱가포르·두바이의 실거래가를 살펴보고, 관심 있는 집의 가격을 비교해 보세요.', locale: 'ko_KR', languageAlternates: { en: '/', ko: '/ko/', 'zh-Hans': '/zh-cn/kr/seoul/' } });

const cities = [
  { name: '서울', photo: MARKET_PHOTOS.seoul, href: '/ko/kr/seoul/', explore: '/ko/kr/seoul/explore/', check: '/ko/kr/seoul/check/', summary: '관심 있는 동네와 단지의 매매·전세·월세 실거래가를 확인하세요.', english: false },
  { name: '싱가포르', photo: MARKET_PHOTOS.singapore, href: '/ko/sg/', explore: '/ko/sg/singapore/explore/', check: '/ko/sg/singapore/check/', summary: '민간 주택과 공공주택(HDB)의 거래 내역을 각각 살펴보세요.', english: false },
  { name: '두바이', photo: MARKET_PHOTOS.dubai, href: '/ko/ae/dubai/', explore: '/ko/ae/dubai/explore/', check: '/ko/ae/dubai/check/', summary: '완공된 주택과 분양 중인 주택의 지역별 가격을 살펴보세요.', english: false },
];
export default function KoreanHome() {
  return <KoreanSiteFrame><main className={styles.homePage}>
    <PassportEntry locale="ko" />
    <section className={styles.section}><h2>어느 도시를 살펴볼까요?</h2><p>동네를 알아보는 중이라면 실거래가를 살펴보세요. 마음에 둔 집이 있다면 가격을 비교해 보세요.</p>
      <ol className={styles.marketGrid}>{cities.map(city => <li className={styles.marketCard} key={city.name}>
        <div className={styles.photo}><Image src={city.photo.src} alt={`${city.name} 도시 전경`} fill sizes="(max-width: 640px) 100vw, 33vw" /></div>
        <div className={styles.marketBody}><h3><Link href={city.href}>{city.name}</Link></h3><p>{city.summary}</p>
          <Link className={styles.marketAction} href={city.explore}>실거래가 보기{city.english ? ' (영문)' : ''}</Link>
          <Link className={styles.marketAction} href={city.check}>관심 매물 가격 비교{city.english ? ' (영문)' : ''}</Link>
        </div>
      </li>)}</ol>
    </section>
    <section className={styles.section}><h2>궁금한 점이 있나요?</h2><p>거래 내역이나 가격 비교 결과가 궁금하다면 문의해 주세요.</p><Link href="/ko/contact/">문의하기</Link></section>
  </main></KoreanSiteFrame>;
}
