import type { ReactNode } from 'react';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '../../lib/site-copy';

export function DubaiShell({ children, href }: Readonly<{ children: ReactNode; href: string }>) {
  return <div id="top"><SiteHeader copy={{ ...homepageCopy.header, marketLabel: 'Dubai', languageLabel: 'EN', links: [{ label: 'Dubai', href, isCurrent: true }] }} />{children}<SiteFooter copy={{ ...homepageCopy.footer, descriptor: 'Property prices and market context, made clear.' }} /></div>;
}
