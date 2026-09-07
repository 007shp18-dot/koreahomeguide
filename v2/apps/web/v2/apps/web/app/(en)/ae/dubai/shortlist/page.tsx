import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { homepageCopy } from '@/lib/site-copy';
export const metadata = { title: 'Dubai budget search & saved places | signedprice', description: 'Search released Dubai price evidence and save places to revisit.', alternates: { canonical: 'https://www.signedprice.com/ae/dubai/shortlist/' }, robots: { index: false, follow: true } };
export default function Page() { return <><SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Dubai', languageLabel: 'EN', links: [{ label: 'Budget & saved', href: '/ae/dubai/shortlist/', isCurrent: true }] }} /><BudgetSearch market="dubai" /><SiteFooter copy={homepageCopy.footer} /></>; }
