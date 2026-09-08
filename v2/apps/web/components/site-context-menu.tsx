'use client';

import { useRef, type ReactNode } from 'react';

/** Native disclosure with the same link dismissal on desktop and mobile. */
export function SiteContextMenu({ children, className }: { children: ReactNode; className: string }) {
  const menu = useRef<HTMLDetailsElement>(null);
  return <details ref={menu} className={className} name="site-header-context" onClickCapture={event => {
    if (event.target instanceof Element && event.target.closest('a[href]')) menu.current?.removeAttribute('open');
  }} onKeyDown={event => {
    if (event.key !== 'Escape') return;
    menu.current?.removeAttribute('open');
    menu.current?.querySelector('summary')?.focus();
  }}>{children}</details>;
}
