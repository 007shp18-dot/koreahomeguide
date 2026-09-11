'use client';

import Link from 'next/link';
import { buildingDisplayLabel } from '../../lib/public-market/building-display-label';
import { useEffect, useId, useRef, type ReactNode } from 'react';

import type { ProductLocale } from '../../lib/locale/product-copy';
import styles from './area-explorer.module.css';

type AreaBuildingDialogProps = Readonly<{
  building: Readonly<{
    id: string;
    name: string;
    neighborhoodName: string;
    districtSlug: string;
  }>;
  detailHref: string;
  locale: ProductLocale;
  onClose: () => void;
  onOpenDetail?: () => void;
  children: ReactNode;
}>;

export function AreaBuildingDialog({
  building,
  detailHref,
  locale,
  onClose,
  onOpenDetail,
  children,
}: AreaBuildingDialogProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const buildingId = building.id;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.requestAnimationFrame(() => {
        if (document.querySelector('[data-building-drawer]') !== null) return;
        if (previousFocus !== null && previousFocus !== document.body && previousFocus.isConnected) {
          previousFocus.focus();
          return;
        }
        const escapedBuildingId = CSS.escape(buildingId);
        document.querySelector<HTMLButtonElement>(
          `[data-building-row="${escapedBuildingId}"] [data-building-preview]`,
        )?.focus();
      });
    };
  }, [building.id]);

  const closeLabel = locale === 'ko' ? '건물 상세 닫기' : locale === 'zh-CN' ? '关闭楼盘详情': 'Close building details';

  return (
    <aside
      className={styles.buildingDrawer}
      role="complementary"
      aria-labelledby={titleId}
      data-building-drawer={building.id}
      data-building-dialog={building.id}
      data-selection-presentation="map-drawer"
    >
      <header className={styles.buildingDialogHeader}>
        <div>
          <p>{locale === 'ko' ? '선택한 건물' : locale === 'zh-CN' ? '所选楼盘': 'Selected building'}</p>
          <h2 id={titleId} title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).title}</h2>
          <span title={buildingDisplayLabel(building, locale).original}>{buildingDisplayLabel(building, locale).location}</span>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
        >
          {locale === 'ko' ? '닫기' : locale === 'zh-CN' ? '关闭': 'Close'} ×
        </button>
      </header>
      <div className={styles.buildingDialogBody}>{children}</div>
      <footer className={styles.buildingDialogFooter}>
        <Link href={detailHref} onClick={onOpenDetail}>
          {locale === 'ko' ? '건물 전체 거래 내역 보기' : locale === 'zh-CN' ? '查看完整楼盘交易': 'Open full building evidence'}
        </Link>
        <button type="button" onClick={onClose}>{locale === 'ko' ? '지도로 돌아가기' : locale === 'zh-CN' ? '返回地图': 'Return to map'}</button>
      </footer>
    </aside>
  );
}
