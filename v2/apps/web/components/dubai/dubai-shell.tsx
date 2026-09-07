import { dubaiEvidenceRepositoryFromEnvironment } from '../../lib/dubai/evidence-repository.server';
import type { ReactNode } from 'react';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '../../lib/site-copy';

export function DubaiShell({ children, href }: Readonly<{ children: ReactNode; href: string }>) {
  const context = dubaiEvidenceRepositoryFromEnvironment()?.getContext();
  return <div id="top"><SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Dubai', languageLabel: 'EN', links: [{ label: 'Dubai', href, isCurrent: true }] }} />{context && <p style={{ maxWidth: 1280, margin: '16px auto', padding: '0 20px', fontSize: '.875rem', lineHeight: 1.6 }}>Source: <a href={context.sourceUrl}>Dubai Land Department open data</a> · {context.comparisonPeriod.from}–{context.comparisonPeriod.to} · SignedPrice is not affiliated with DLD or the Government of Dubai.</p>}{children}<SiteFooter copy={{ ...homepageCopy.footer, descriptor: 'Property prices and market context, made clear.' }} /></div>;
}
