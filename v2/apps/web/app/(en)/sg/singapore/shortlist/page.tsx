import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { homepageCopy } from '@/lib/site-copy';
export const metadata = { title: 'Singapore budget search & saved places | signedprice', description: 'Search released Singapore price evidence and save places to revisit.', alternates: { canonical: 'https://www.signedprice.com/sg/singapore/shortlist/' }, robots: { index: false, follow: true } };
export default function Page() { return <><SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Singapore', languageLabel: 'EN', links: [{ label: 'Budget & saved', href: '/sg/singapore/shortlist/', isCurrent: true }] }} /><BudgetSearch market="singapore" /><SiteFooter copy={homepageCopy.footer} /></>; }
