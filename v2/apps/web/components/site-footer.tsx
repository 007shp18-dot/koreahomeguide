import Link from 'next/link';
import type { SiteFooterModel } from '../lib/site-copy';
import { globalNavigation, marketNavigation, type SiteLocale } from '../lib/navigation/site-navigation';
import { BrandWordmark } from './brand-mark';
import styles from './site-footer.module.css';

// Official accounts connected to SignedPrice's Metricool brand.
const socialAccounts = [
  { label: 'Instagram', href: 'https://www.instagram.com/signedprice/' },
  { label: 'Threads', href: 'https://www.threads.com/@signedprice' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/143759950/' },
] as const;

export function SiteFooter({ copy, locale = 'en' }: Readonly<{ copy: SiteFooterModel; locale?: SiteLocale }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const marketLinks = marketNavigation.map((market) => ({
    ...market,
    label: ko
      ? ({ 'kr-seoul': '서울', 'sg-singapore': '싱가포르', 'ae-dubai': '두바이', 'jp-tokyo': '도쿄' } as const)[market.id]
      : zh
        ? ({ 'kr-seoul': '首尔', 'sg-singapore': '新加坡', 'ae-dubai': '迪拜', 'jp-tokyo': '东京' } as const)[market.id]
        : market.label,
    href: ko && market.id !== 'jp-tokyo'
      ? ({ 'kr-seoul': '/ko/kr/seoul/', 'sg-singapore': '/ko/sg/', 'ae-dubai': '/ko/ae/dubai/' } as const)[market.id]
      : market.href,
  }));
  const groups = [
    { label: ko ? '서비스' : zh ? '探索' : 'Explore', links: [...globalNavigation(locale), { label: ko ? '지역 비교' : zh ? '地区排名' : 'Rankings', href: ko ? '/ko/rankings/' : '/rankings/' }] },
    { label: ko ? '도시' : zh ? '城市' : 'Cities', links: marketLinks },
    { label: ko ? '도움말' : zh ? '帮助' : 'Help', links: [{ label: ko ? '데이터와 출처 (영문)' : zh ? '数据与来源（英文）' : 'Data & sources', href: '/trust/' }, { label: ko ? '문의' : zh ? '联系我们（英文）' : 'Contact', href: ko ? '/ko/contact/' : '/contact/' }, { label: ko ? '개인정보 처리방침 (영문)' : zh ? '隐私（英文）' : 'Privacy', href: '/privacy/' }] },
  ];
  return <footer className={styles.footer} aria-label={copy.navigationLabel}>
    <div className={styles.inner}>
      <div className={styles.intro}><Link href={ko ? '/ko/' : '/'} aria-label="signedprice home"><BrandWordmark /></Link><p className={styles.descriptor}>{ko ? '도시를 알아보고, 거래를 비교하고, 나에게 맞는 집을 찾아보세요.' : zh ? '了解城市，比较成交，找到适合自己的家。' : 'Discover a city. Understand its prices. Find your place.'}</p></div>
      <div className={styles.navigation}>{groups.map((group) => <nav key={group.label} aria-label={`Footer ${group.label}`}><p>{group.label}</p><ul className={styles.links}>{group.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></nav>)}</div>
      <nav className={styles.social} aria-label={ko ? 'SignedPrice 공식 SNS' : zh ? 'SignedPrice 官方社交账号' : 'SignedPrice social accounts'}>
        <p>{ko ? '소셜에서 만나세요' : zh ? '关注我们' : 'Follow SignedPrice'}</p>
        <ul>{socialAccounts.map((account) => <li key={account.label}><a href={account.href} target="_blank" rel="noopener noreferrer" aria-label={`${account.label} · SignedPrice${ko ? ' · 새 탭' : zh ? ' · 新标签页' : ' · new tab'}`}>{account.label}</a></li>)}</ul>
      </nav>
    </div>
  </footer>;
}
