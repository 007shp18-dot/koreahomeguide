'use client';

import { useRef, type MouseEvent, type ReactNode } from 'react';

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
      ref={menuRef}
    >
      <summary aria-label={summaryLabel}>☰ <span>{summaryText}</span></summary>
      <div className="site-header__mobile-panel">{children}</div>
    </details>
  );
}
