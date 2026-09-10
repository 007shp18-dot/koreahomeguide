import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ContactPageContent } from '@/components/operator/contact-page-content';
import { operatorProfileFromEnvironment } from '@/lib/operator/operator-profile.server';
import { SIGNEDPRICE_PRIVACY_EMAIL } from '@/lib/operator/public-contacts';
import { indexableMetadata } from '@/lib/public-metadata';
import { homepageCopy } from '@/lib/site-copy';

export function generateMetadata(): Metadata {
  return indexableMetadata({ path: '/contact/', title: 'Contact | signedprice', description: 'Contact SignedPrice about property data, the site, partnerships or a correction.' });
}

export default function ContactPage() {
  const profile = operatorProfileFromEnvironment();
  return <div id="top">
    <SiteHeader copy={{ ...homepageCopy.header, links: [{ label: 'Contact', href: '/contact/', isCurrent: true }] }} />
    <ContactPageContent privacyContact={profile.status === 'ready' ? profile.privacyContact : SIGNEDPRICE_PRIVACY_EMAIL} />
    <SiteFooter copy={homepageCopy.footer} />
  </div>;
}
