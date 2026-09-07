'use client';
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';


import Link from 'next/link';
import { useState, type ReactNode } from 'react';

export function EvidencePendingLink({ locale = 'en',
  href,
  children,
  className,
  ariaLabel,
}: Readonly<{ locale?: MarketLocale;
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}>) {
  const [pending, setPending] = useState(false);
  return <Link
    href={marketHref(locale, href)}
    className={className}
    aria-label={sgText(locale, ariaLabel)}
    aria-busy={pending}
    data-navigation-state={pending ? 'pending' : 'idle'}
    onClick={() => setPending(true)}
  >{sgText(locale, children)}</Link>;
}
