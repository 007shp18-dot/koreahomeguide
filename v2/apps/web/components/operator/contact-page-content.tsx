import Link from 'next/link';
import { SIGNEDPRICE_CONTACT_EMAIL } from '@/lib/operator/public-contacts';
import styles from './contact-page.module.css';

export function ContactPageContent({ locale = 'en', privacyContact }: { locale?: 'en' | 'ko'; privacyContact: string }) {
  const ko = locale === 'ko';
  return <main className={styles.page}>
    <header className={styles.hero} data-product-intro="true">
      <p className={styles.eyebrow}>{ko ? '도움말' : 'Help'}</p>
      <h1>{ko ? '어떤 점이 궁금한가요?' : 'Contact SignedPrice'}</h1>
      <p>{ko ? '사이트 이용, 거래 정보, 제휴에 관해 문의하세요.' : 'Questions about the site, property data or working together? Get in touch.'}</p>
    </header>
    <section className={styles.primary} aria-labelledby="contact-primary">
      <div>
        <span id="research-seoul" aria-hidden="true" /><span id="research-singapore" aria-hidden="true" /><span id="research-dubai" aria-hidden="true" />
        <h2 id="contact-primary">{ko ? '일반·제휴 문의' : 'General enquiries & partnerships'}</h2>
        <a className={styles.email} href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a>
      </div>
      <div className={styles.context}>
        <h3>{ko ? '함께 알려주시면 좋아요' : 'A little context helps'}</h3>
        <p>{ko ? '도시, 관련 페이지 링크, 궁금한 점을 적어주세요. 가격을 비교하는 중이라면 주택 유형과 면적을 알려주시면 도움이 됩니다.' : 'Include the city, a link to the page and your question. If you are comparing prices, the property type and size are useful too.'}</p>
        <p className={styles.note}>{ko ? '신분증, 계좌 정보, 비공개 계약서는 보내지 마세요.' : 'Please leave out identity documents, bank details and private contracts.'}</p>
      </div>
    </section>
    <section className={styles.routes} aria-label={ko ? '개인정보 및 데이터 문의' : 'Privacy and data enquiries'}>
      <article>
        <h2>{ko ? '거래 정보 오류 신고' : 'Correct a data issue'}</h2>
        <div>
          <p>{ko ? '서울 거래 정보의 오류는 정정 페이지에서 알려주세요. 검토 결과와 변경 내용을 확인할 수 있습니다. 다른 도시의 오류는 위 이메일로 관련 링크를 보내주세요.' : 'Use the correction page for Seoul records so the report and review result can be followed. For another city, send the relevant page link to the email above.'}</p>
          <div className={styles.links}><Link href="/kr/seoul/corrections/">{ko ? '서울 데이터 정정 (영문)' : 'Seoul corrections'}</Link><Link href="/trust/">{ko ? '데이터와 출처 (영문)' : 'Data & sources'}</Link></div>
        </div>
      </article>
      <article>
        <h2>{ko ? '개인정보 문의' : 'Personal information'}</h2>
        <div>
          <p>{ko ? '개인정보 열람·정정·삭제, 동의 또는 처리 방식에 관한 문의는 개인정보 담당 주소로 보내주세요.' : 'For access, correction, deletion, consent or questions about how personal information is handled, contact our privacy address.'}</p>
          <div className={styles.links}><a href={`mailto:${privacyContact}`}>{privacyContact}</a><Link href="/privacy/">{ko ? '개인정보 처리방침 (영문)' : 'Privacy notice'}</Link></div>
        </div>
      </article>
    </section>
    <p className={styles.scope}>{ko ? '현재 중개·감정평가·개인별 투자 자문은 제공하지 않습니다. 개별 주택에 대한 답변에는 추가 자료나 현지 확인이 필요할 수 있습니다.' : 'An enquiry does not book brokerage, a valuation or personalised investment advice. A question about an individual property may need further sources or local checks.'}</p>
  </main>;
}
