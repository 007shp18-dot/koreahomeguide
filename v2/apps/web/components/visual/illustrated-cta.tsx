import Image from 'next/image';
import Link from 'next/link';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import styles from './visual-panels.module.css';

export function IllustratedCta({ locale }: { locale: SiteLocale }) {
  const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
  const copy = locale === 'ko'
    ? ['데이터가 만드는', '더 현명한 집 선택', '실제 거래를 확인하고, 다음 선택을 준비하세요.', '가격 탐색하기', '구매·임대 가이드']
    : locale === 'zh-CN' ? ['从真实数据出发', '找到更适合你的家', '查看真实成交，为下一步做好准备。', '探索成交价格', '购房与租房指南']
    : ['Better data.', 'A brighter move.', 'See what really traded. Get ready for your next home.', 'Explore prices', 'Buying & renting guides'];
  return <section className={styles.cta} data-illustrated-cta="true" aria-label={copy[1]}>
    <div><p className={styles.ctaEyebrow}>SIGNEDPRICE / YOUR NEXT MOVE</p><h2>{copy[0]}<br/>{copy[1]}</h2><p>{copy[2]}</p>
      <nav aria-label={locale === 'ko' ? '조금 더 자세히' : locale === 'zh-CN' ? '进一步了解' : 'Take a closer look'}>
        <Link href={`${prefix}/prices/`}>{copy[3]} <span aria-hidden="true">→</span></Link>
        <Link href={`${prefix}/guides/`}>{copy[4]}</Link>
        <Link className={styles.ctaText} href={`${prefix}/news`}>{locale === 'ko' ? '시장 인사이트' : locale === 'zh-CN' ? '市场洞察' : 'Market insights'}</Link>
        <Link className={styles.ctaText} href={`${prefix}/tools/`}>{locale === 'ko' ? '예산 비교·비용 계산' : locale === 'zh-CN' ? '预算与费用工具' : 'Tools & calculators'}</Link>
      </nav>
    </div>
    <div className={styles.ctaArt}><Image src="/assets/visual/blue-houses.webp" alt="" width={331} height={180} sizes="(max-width:700px) 80vw, 38vw" /><span aria-hidden="true">A brighter home.</span></div>
  </section>;
}
