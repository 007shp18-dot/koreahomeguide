'use client';

import { useRef, type MouseEvent, type ReactNode } from 'react';
import { UiIcon } from './ui-icon';

export function SiteMobileMenu({
  children,
  summaryLabel,
  summaryText,
}: Readonly<{
  children: ReactNode;
  summaryLabel: string;
  summaryText: string;
}>) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeAfterLinkActivation(event: MouseEvent<HTMLDetailsElement>) {
    const target = event.target;
    if (!(target instanceof Element) || target.closest('a[href]') === null) return;
    menuRef.current?.removeAttribute('open');
  }

  return (
    <details
      className="site-header__mobile-menu"
      onClickCapture={closeAfterLinkActivation}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;
        menuRef.current?.removeAttribute('open');
        menuRef.current?.querySelector('summary')?.focus();
      }}
      ref={menuRef}
    >
      <summary aria-label={summaryLabel}><UiIcon name="menu" /><span>{summaryText}</span></summary>
      <div className="site-header__mobile-panel">{children}</div>
    </details>
  );
}
