'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

export function EvidencePendingLink({
  href,
  children,
  className,
  ariaLabel,
}: Readonly<{
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}>) {
  const [pending, setPending] = useState(false);
  return <Link
    href={href}
    className={className}
    aria-label={ariaLabel}
    aria-busy={pending}
    data-navigation-state={pending ? 'pending' : 'idle'}
    onClick={() => setPending(true)}
  >{children}</Link>;
}
