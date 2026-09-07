import Link from 'next/link';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import styles from '@/components/operator/operator-page.module.css';
import { SIGNEDPRICE_CONTACT_EMAIL, SIGNEDPRICE_PRIVACY_EMAIL } from '@/lib/operator/public-contacts';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/ko/contact/', title: '문의하기 | SignedPrice', description: '서울·싱가포르·두바이의 실거래가와 가격 비교 서비스에 대해 문의하세요.', locale: 'ko_KR', languageAlternates: { en: '/contact/', ko: '/ko/contact/' } });
export default function KoreanContact() {
  return <KoreanSiteFrame href="/ko/contact/"><main className={styles.page}>
    <header className={styles.hero}><p className={styles.eyebrow}>SignedPrice · 문의</p><h1>어떤 점이 궁금한가요?</h1><p>어느 도시의 어떤 정보가 궁금한지 알려주세요.</p></header>
    <section className={styles.grid} aria-label="도시별 문의">{[['seoul', '서울'], ['singapore', '싱가포르'], ['dubai', '두바이']].map(([id, city]) => {
      const body = `도시: ${city}\n집을 알아보는 이유 (실거주 / 임대 / 투자):\n예산 (통화와 함께, 선택):\n관심 지역이나 매물 링크 (선택):\n궁금한 점:\n\n신분증, 계좌 정보, 비공개 계약서는 첨부하지 마세요.`;
      return <article id={`research-${id}`} key={id}><h2>{city} 문의</h2><p>예산이나 매물 링크도 함께 적어주시면 도움이 됩니다.</p><div className={styles.actions}><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}?subject=${encodeURIComponent(`${city} 부동산 정보 문의`)}&body=${encodeURIComponent(body)}`}>이메일로 문의하기</a></div><p>메일 앱이 열립니다. 내용을 작성한 뒤 직접 보내주세요.</p></article>;
    })}</section>
    <section className={styles.notice}><div><h2>문의 전 확인해 주세요</h2><p>실거래 정보와 서비스 이용 방법에 대해 문의하실 수 있습니다. 현재 매물 중개나 감정평가, 개인별 투자 자문은 제공하지 않습니다. 개별 매물의 상태나 비용은 추가 자료 또는 현지 확인이 필요합니다. 신분증·계좌 정보·계약서는 보내지 마세요.</p></div><Link href="/privacy/">개인정보 처리방침 (영문)</Link></section>
    <section className={styles.grid}><article><h2>일반·제휴 문의</h2><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a></article><article><h2>개인정보 문의</h2><a href={`mailto:${SIGNEDPRICE_PRIVACY_EMAIL}`}>{SIGNEDPRICE_PRIVACY_EMAIL}</a></article><article><h2>서울 거래 정보 오류 신고</h2><Link href="/kr/seoul/corrections/">오류 신고하기 (영문)</Link></article></section>
  </main></KoreanSiteFrame>;
}
