import Link from 'next/link';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import styles from '@/components/operator/operator-page.module.css';
import { SIGNEDPRICE_CONTACT_EMAIL, SIGNEDPRICE_PRIVACY_EMAIL } from '@/lib/operator/public-contacts';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/ko/contact/', title: '자료·서비스 문의 | SignedPrice', description: '서울·싱가포르·두바이의 거래 자료와 비교 방법에 관한 질문을 보내세요.', locale: 'ko_KR', languageAlternates: { en: '/contact/', ko: '/ko/contact/' } });
export default function KoreanContact() {
  return <KoreanSiteFrame href="/ko/contact/"><main className={styles.page}>
    <header className={styles.hero}><p className={styles.eyebrow}>SignedPrice · 문의</p><h1>어떤 점이 궁금한가요?</h1><p>관심 도시와 검토 목적, 자료에서 확인하지 못한 질문을 보내주세요.</p></header>
    <section className={styles.grid} aria-label="도시별 자료 문의">{[['seoul', '서울'], ['singapore', '싱가포르'], ['dubai', '두바이']].map(([id, city]) => {
      const body = `관심 도시: ${city}\n목적 (실거주 / 임대 / 투자):\n예산 및 통화 (선택):\n지역 또는 공개 매물 링크 (선택):\n궁금한 점:\n\n신분증, 계좌 정보, 비공개 계약서는 첨부하지 마세요.`;
      return <article id={`research-${id}`} key={id}><h2>{city} 자료 문의</h2><p>예산과 매물 링크는 선택 사항입니다. 개인정보가 담긴 문서는 보내지 마세요.</p><div className={styles.actions}><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}?subject=${encodeURIComponent(`${city} 부동산 자료 문의`)}&body=${encodeURIComponent(body)}`}>이메일 초안 열기</a></div><p>메일 앱에서 직접 전송하기 전에는 문의가 발송되지 않습니다.</p></article>;
    })}</section>
    <section className={styles.notice}><div><h2>문의 범위</h2><p>공개 데이터와 비교 방법에 관한 질문을 받습니다. 중개·감정평가·개인별 투자 자문 예약이 아니며, 개별 물건은 추가 자료나 현지 확인이 필요할 수 있습니다.</p></div><Link href="/privacy/">개인정보 처리방침 (영문)</Link></section>
    <section className={styles.grid}><article><h2>일반·제휴 문의</h2><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a></article><article><h2>개인정보 문의</h2><a href={`mailto:${SIGNEDPRICE_PRIVACY_EMAIL}`}>{SIGNEDPRICE_PRIVACY_EMAIL}</a></article><article><h2>서울 데이터 정정</h2><Link href="/kr/seoul/corrections/">정정 요청 (영문)</Link></article></section>
  </main></KoreanSiteFrame>;
}
