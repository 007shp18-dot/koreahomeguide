import type { ReactNode } from 'react';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { homepageCopy } from '../lib/site-copy';

export function KoreanSiteFrame({ children, href = '/ko/' }: { children: ReactNode; href?: string }) {
  return <div id="top"><SiteHeader copy={{ ...homepageCopy.header, homeHref: '/ko/', homeLabel: 'SignedPrice 홈', languageLabel: 'KO', links: [{ label: '홈', href, isCurrent: true }] }} />{children}<SiteFooter locale="ko" copy={{ ...homepageCopy.footer, descriptor: '서울·싱가포르·두바이의 실거래가와 부동산 정보.' }} /></div>;
}
