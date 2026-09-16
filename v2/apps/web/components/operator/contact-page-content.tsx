import { PurchaseEnquiry } from '../buying/purchase-enquiry';
import Link from 'next/link';
import { SIGNEDPRICE_CONTACT_EMAIL } from '@/lib/operator/public-contacts';
import styles from './contact-page.module.css';

export function ContactPageContent({ locale = 'en', privacyContact }: { locale?: 'en' | 'ko' | 'zh-CN'; privacyContact: string }) {
  const ko = locale === 'ko';
  if(locale==='zh-CN') return <main className={styles.page}><header className={styles.hero}><p className={styles.eyebrow}>联系 SignedPrice</p><h1>从预算到下一步</h1><p>说明意向城市、预算与问题，询问可提供的购房研究帮助。</p></header><PurchaseEnquiry locale={locale} /><section><h2>资料与隐私问题</h2><p><a href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a></p><p><a href={`mailto:${privacyContact}`}>{privacyContact}</a> · <Link href="/privacy/">隐私政策（英文）</Link></p></section></main>;

  return <main className={styles.page}>
    <header className={styles.hero} data-product-intro="true">
      <p className={styles.eyebrow}>{ko ? '도움말' : 'Help'}</p>
      <h1>{ko ? '어떤 점이 궁금한가요?' : 'Contact SignedPrice'}</h1>
      <p>{ko ? '관심 도시와 예산, 구매 시점을 알려주세요. 필요한 정보와 현지 업체 연결 가능 여부를 확인해 안내합니다.' : 'Tell us your city, budget and purchase timing. We will clarify what information or local introductions are available for your enquiry.'}</p>
    </header>
    <div className={styles.links}><Link href={ko ? "/ko/about/" : "/about/"}>{ko ? "SignedPrice 소개와 서비스" : "About SignedPrice and our services"}</Link></div>
    <PurchaseEnquiry locale={locale} />
    <section className={styles.primary} aria-labelledby="contact-primary">
      <div>
        <span id="research-seoul" aria-hidden="true" /><span id="research-singapore" aria-hidden="true" /><span id="research-dubai" aria-hidden="true" /><span id="research-tokyo" aria-hidden="true" />
        <h2 id="contact-primary">{ko ? '부동산 조사·제휴 문의' : 'Property research & partnerships'}</h2>
        <a className={styles.email} href={`mailto:${SIGNEDPRICE_CONTACT_EMAIL}`}>{SIGNEDPRICE_CONTACT_EMAIL}</a>
      </div>
      <div className={styles.context}>
        <h3>{ko ? '함께 알려주시면 좋아요' : 'A little context helps'}</h3>
        <p>{ko ? '도시, 관련 페이지의 정확한 링크와 확인하려는 내용을 적어주세요. 가격을 비교하는 중이라면 통화, 예산, 주택 유형, 면적과 비교 기간도 알려주세요.' : 'Include the city, the exact page link and what you are trying to check. For a price comparison, add the currency, budget, property type, size and comparison period.'}</p>
        <p>{ko ? '공개된 출처와 페이지의 계산 방식을 찾고 설명하거나, 지원되는 데이터 정정 절차를 안내할 수 있습니다.' : 'We can point to published sources, explain the calculation shown on a SignedPrice page and direct a supported data correction.'}</p>
        <p className={styles.note}>{ko ? '신분증, 계좌 정보, 비공개 계약서는 보내지 마세요.' : 'Please leave out identity documents, bank details and private contracts.'}</p>
      </div>
    </section>
    <section className={styles.routes} aria-label={ko ? '개인정보 및 데이터 문의' : 'Privacy and data enquiries'}>
      <article>
        <h2>{ko ? '거래 정보 오류 신고' : 'Correct a data issue'}</h2>
        <div>
          <p>{ko ? '서울과 싱가포르 거래 정보의 오류는 각 정정 페이지에서 알려주세요. 검토 결과와 변경 내용을 확인할 수 있습니다. 두바이와 도쿄의 오류는 위 이메일로 정확한 페이지 링크를 보내주세요.' : 'Use the Seoul or Singapore correction page for those records so the report and review result can be followed. For Dubai or Tokyo, send the exact page link to the email above.'}</p>
          <div className={styles.links}><Link href={ko ? "/ko/kr/seoul/corrections/" : "/kr/seoul/corrections/"}>{ko ? '서울 데이터 정정 이력' : 'Seoul data corrections'}</Link><Link href={ko ? "/ko/sg/singapore/corrections/" : "/sg/singapore/corrections/"}>{ko ? '싱가포르 데이터 정정 이력' : 'Singapore data corrections'}</Link><Link href="/trust/">{ko ? '데이터와 출처 (영문)' : 'Data & sources'}</Link></div>
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
