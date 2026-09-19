import Link from 'next/link';
import styles from './about-page.module.css';

export function AboutPageContent({ locale = 'en' }: { locale?: 'en' | 'ko' }) {
  const ko = locale === 'ko';
  const contact = ko ? '/ko/contact/' : '/contact/';
  const services = ko ? [
    ['가격과 매물 비교', '같은 예산으로 어떤 집을 살 수 있는지 살펴봅니다. 실거래가와 매도 호가를 구분하고 면적, 거래 시점, 추가 비용을 함께 비교합니다.'],
    ['지역·단지 분석', '출퇴근, 생활 편의, 주거 환경과 공개된 경험담을 바탕으로 후보의 장점과 불편을 정리합니다. 지역 전체의 이야기와 특정 단지의 평가는 구분합니다.'],
    ['구매 준비 안내', '구매 절차와 비용 구조를 설명하고, 계약 전 현지에서 확인할 질문을 정리합니다. 관심 있는 집에서 다음 단계로 넘어갈 때 필요한 정보를 제공합니다.'],
    ['현지 업체 연결', '관심 지역·예산·구매 시점을 남겨주시면 현지 업체 연결 가능 여부와 진행 절차를 안내합니다. 연결 범위와 조건은 문의별로 확인합니다.'],
  ] : [
    ['Prices and property comparisons', 'See what a budget can buy. We distinguish recorded transactions from asking prices and compare size, timing and the additional costs of a purchase.'],
    ['Area and property analysis', 'Understand the trade-offs in commuting, everyday amenities and the living environment. Public accounts provide context; neighbourhood opinions are kept separate from evidence about a particular property.'],
    ['Purchase preparation', 'Understand the steps and costs, and put together the questions that need a local answer before signing. We help turn a shortlist into a more informed next conversation.'],
    ['Local introductions', 'Tell us your location, budget and purchase timing. We will explain whether an introduction is available and how it would work. Availability, scope and terms are confirmed for each enquiry.'],
  ];
  return <main data-interface-page="about" className={styles.page}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>ABOUT SIGNEDPRICE</p>
      <h1>{ko ? '해외 주택 비교부터 현지 업체 연결까지' : 'From comparing homes abroad to finding local help'}</h1>
      <p>{ko ? '집을 알아볼 때 어려운 것은 매물을 찾는 일만이 아닙니다. 가격이 합리적인지, 실제로 살기에는 어떤지, 다음에는 누구에게 무엇을 물어봐야 하는지. SignedPrice는 그 질문을 함께 정리합니다.' : 'Finding a listing is only the start. Is the price reasonable? What would everyday life be like? Who should you speak to next, and what should you ask? SignedPrice helps you work through those questions.'}</p>
      <Link className={styles.button} href={contact}>{ko ? '구매·현지 연결 문의' : 'Discuss a purchase or introduction'}</Link>
    </header>
    <section className={styles.section} aria-labelledby="services"><h2 id="services">{ko ? '제공하는 서비스' : 'How we can help'}</h2>
      <div className={styles.services}>{services.map(([title, body], i) => <article key={title}><span className={styles.number}>0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>
    <section className={styles.section}><h2>{ko ? '문의 이후에는' : 'What happens after an enquiry'}</h2><ol className={styles.steps}>
      <li><h3>{ko ? '조건을 알려주세요' : 'Share your brief'}</h3><p>{ko ? '관심 도시, 예산, 구매 목적과 시점을 남겨주세요. 아직 후보가 없어도 괜찮습니다.' : 'Start with your city, budget, purpose and timing. You do not need to have chosen a property.'}</p></li>
      <li><h3>{ko ? '도움의 범위를 정합니다' : 'Agree the scope'}</h3><p>{ko ? '필요한 정보와 연결 가능 여부를 확인합니다. 별도 비용이나 소개 수수료가 있는 경우 진행 전에 안내합니다.' : 'We confirm what information or introductions are available. Any applicable fees or referral arrangements are explained before you proceed.'}</p></li>
      <li><h3>{ko ? '현지 확인으로 이어갑니다' : 'Take the next local step'}</h3><p>{ko ? '연결이 가능한 경우 동의한 범위에서 문의 내용을 전달합니다. 매물 확인, 계약과 거래는 해당 현지 업체와 진행합니다.' : 'Where an introduction is available, we share your enquiry within the scope you agree to. Property checks, contracts and transactions are handled with the relevant local provider.'}</p></li>
    </ol></section>
    <section className={`${styles.section} ${styles.background}`}><h2>{ko ? '운영 배경' : 'Our background'}</h2><div>
      <p>{ko ? 'SignedPrice는 글로벌 컨설팅 업무 경험과 글로벌 대기업의 재무 업무 경력을 바탕으로, 해외 주택을 비교하는 데 필요한 정보를 정리합니다.' : 'SignedPrice brings together experience in global consulting and finance at a major multinational company to organise information for people comparing homes abroad.'}</p>
      <p>{ko ? '서로 다른 조건을 같은 기준으로 비교하는 일, 가격 뒤에 숨은 비용을 살피는 일, 숫자만으로 설명되지 않는 차이를 묻는 일에 집중합니다. 매물 소개를 읽고도 남는 질문에 도움이 되는 서비스를 만들고자 합니다.' : 'We focus on comparing like with like, looking beyond the headline price and asking what the numbers leave out. Our aim is to help with the questions that remain after you have read a listing.'}</p>
      <p className={styles.note}>{ko ? '이 경력이 부동산 중개 자격이나 투자 성과를 의미하지는 않습니다. SignedPrice는 정보 제공과 연결을 담당하며, 중개·법률·세무 업무는 해당 자격과 권한을 갖춘 현지 전문가의 영역입니다.' : 'These professional backgrounds are not real-estate licences or investment track records. SignedPrice provides information and introductions; regulated brokerage, legal and tax work belongs with appropriately authorised professionals.'}</p>
    </div></section>
    <section className={styles.section}><h2>{ko ? '정보를 다루는 기준' : 'How we handle information'}</h2><p>{ko ? '호가와 실거래가, 확인된 자료와 작성자의 의견을 구분합니다. 자료의 시점과 범위를 함께 표시하고, 근거가 부족한 부분은 단정하지 않습니다. 공개된 분석은 개별 주택의 상태나 계약 조건을 보증하지 않습니다.' : 'We separate asking prices from completed transactions, and documented facts from opinion. We show the date and scope of the material and leave uncertainties visible. Published analysis does not guarantee a property’s condition or contract terms.'}</p><Link href="/trust/">{ko ? '데이터와 출처 기준 보기 (영문)' : 'Read our data and sourcing standards'}</Link></section>
    <section className={styles.cta}><h2>{ko ? '어느 도시의 집을 보고 있나요?' : 'Where are you looking?'}</h2><p>{ko ? '서울 · 싱가포르 · 두바이 · 도쿄. 관심 지역과 지금 고민하는 내용을 알려주세요.' : 'Seoul · Singapore · Dubai · Tokyo. Tell us where you are looking and what you need to understand next.'}</p><Link className={styles.button} href={contact}>{ko ? '문의 남기기' : 'Send an enquiry'}</Link></section>
  </main>;
}
