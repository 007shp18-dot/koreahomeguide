import Image from 'next/image';
import Link from 'next/link';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { PassportEntry } from '@/components/passport/passport-entry';
import { MARKET_PHOTOS } from '@/components/market-representative-photo';
import styles from '@/components/design-review/editorial-growth-home.module.css';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/ko/', title: '서울·싱가포르·두바이 부동산 실거래 비교 | SignedPrice', description: '예산으로 도시를 비교하고, 지역과 건물을 찾고, 제시가격을 신고 거래와 비교하세요.', locale: 'ko_KR', languageAlternates: { en: '/', ko: '/ko/' } });

const cities = [
  { name: '서울', photo: MARKET_PHOTOS.seoul, href: '/ko/kr/seoul/', explore: '/ko/kr/seoul/explore/', check: '/ko/kr/seoul/check/', summary: '매매·전세·월세를 구·동·단지별로 확인하세요.', english: false },
  { name: '싱가포르', photo: MARKET_PHOTOS.singapore, href: '/ko/sg/', explore: '/sg/singapore/explore/', check: '/sg/singapore/check/', summary: '민간 주택과 HDB를 구분해 거래를 비교하세요.', english: true },
  { name: '두바이', photo: MARKET_PHOTOS.dubai, href: '/ko/ae/dubai/', explore: '/ae/dubai/explore/', check: '/ae/dubai/check/', summary: '준공·분양 단계별 지역 가격과 임대료를 확인하세요.', english: true },
];
export default function KoreanHome() {
  return <KoreanSiteFrame><main className={styles.homePage}>
    <PassportEntry locale="ko" />
    <section className={styles.section}><h2>어느 도시를 살펴볼까요?</h2><p>지역을 고르는 중이라면 실거래 탐색부터, 후보가 있다면 제시가격 확인부터 시작하세요.</p>
      <ol className={styles.marketGrid}>{cities.map(city => <li className={styles.marketCard} key={city.name}>
        <div className={styles.photo}><Image src={city.photo.src} alt={`${city.name} 도시 전경`} fill sizes="(max-width: 640px) 100vw, 33vw" /></div>
        <div className={styles.marketBody}><h3><Link href={city.href}>{city.name}</Link></h3><p>{city.summary}</p>
          <Link className={styles.marketAction} href={city.explore}>실거래 탐색{city.english ? ' (영문)' : ''}</Link>
          <Link className={styles.marketAction} href={city.check}>제시가격 확인{city.english ? ' (영문)' : ''}</Link>
        </div>
      </li>)}</ol>
    </section>
    <section className={styles.section}><h2>자료를 봐도 궁금한 점이 남았나요?</h2><p>관심 도시와 구매 목적, 비교하면서 막힌 질문을 알려주세요. 개별 매물의 중개·감정평가를 예약하는 창구는 아닙니다.</p><Link href="/ko/contact/">자료 관련 질문 보내기</Link></section>
  </main></KoreanSiteFrame>;
}
