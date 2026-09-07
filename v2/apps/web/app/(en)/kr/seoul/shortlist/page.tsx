import { SeoulShortlist } from '@/components/seoul-shortlist/shortlist';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { homepageCopy } from '@/lib/site-copy';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({
  path: '/kr/seoul/shortlist/', title: 'Seoul apartment budget search & saved transactions | signedprice',
  description: 'Find Seoul apartment groups with recent recorded sales within your budget and save them to check for transaction updates.',
  languageAlternates: { en: '/kr/seoul/shortlist/', ko: '/ko/kr/seoul/shortlist/' },
});
export default function Page() {
  return <><SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Seoul', links: [{ label: 'Budget & saved', href: '/kr/seoul/shortlist/', isCurrent: true }], languageSwitch: { label: 'KO', href: '/ko/kr/seoul/shortlist/', hrefLang: 'ko' } }} /><SeoulShortlist /><SiteFooter copy={homepageCopy.footer} /></>;
}
