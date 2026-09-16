import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { AboutPageContent } from '@/components/operator/about-page-content';
import { indexableMetadata } from '@/lib/public-metadata';
import { homepageCopy } from '@/lib/site-copy';

export function generateMetadata(): Metadata {
  return indexableMetadata({ path: '/about/', title: 'About SignedPrice | Property research and local introductions', description: 'Compare homes abroad, understand purchase costs and enquire about local introductions. Learn about SignedPrice and our services.', languageAlternates: { en: '/about/', ko: '/ko/about/' } });
}

export default function AboutPage() {
  return <div id="top">
    <SiteHeader copy={{ ...homepageCopy.header, links: [{ label: 'About', href: '/about/', isCurrent: true }] }} />
    <AboutPageContent />
    <SiteFooter copy={homepageCopy.footer} />
  </div>;
}
