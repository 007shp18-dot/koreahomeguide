'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, type ReactNode } from 'react';

import type { ProductLocale } from '../../lib/locale/product-copy';
import styles from './area-explorer.module.css';

type AreaBuildingDialogProps = Readonly<{
  building: Readonly<{
    id: string;
    name: string;
    neighborhoodName: string;
  }>;
  detailHref: string;
  locale: ProductLocale;
  onClose: () => void;
  children: ReactNode;
}>;

export function AreaBuildingDialog({
  building,
  detailHref,
  locale,
  onClose,
  children,
}: AreaBuildingDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (first === undefined || last === undefined) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const closeLabel = locale === 'ko' ? '건물 상세 닫기' : 'Close building details';

  return (
    <div
      className={styles.buildingDialogBackdrop}
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={styles.buildingDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-building-dialog={building.id}
      >
        <header className={styles.buildingDialogHeader}>
          <div>
            <p>{locale === 'ko' ? '선택한 건물' : 'Selected building'}</p>
            <h2 id={titleId}>{building.name}</h2>
            <span>{building.neighborhoodName}</span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
          >
            {locale === 'ko' ? '닫기' : 'Close'} ×
          </button>
        </header>
        <div className={styles.buildingDialogBody}>{children}</div>
        <footer className={styles.buildingDialogFooter}>
          <Link href={detailHref}>
            {locale === 'ko' ? '전체 건물 근거 열기' : 'Open full building evidence'}
          </Link>
          <button type="button" onClick={onClose}>{locale === 'ko' ? '지도로 돌아가기' : 'Return to map'}</button>
        </footer>
      </section>
    </div>
  );
}
