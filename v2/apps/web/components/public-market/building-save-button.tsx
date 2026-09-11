'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';

import {
  parseSavedSearch,
  readSavedSearch,
  subscribeSavedSearch,
  writeSavedSearch,
} from '../../lib/seoul-shortlist/storage';
import styles from './building-save-button.module.css';

const serverSnapshot = () => '';

export function BuildingSaveButton({
  buildingKey,
  buildingName,
  locale = 'en',
  variant = 'row',
}: Readonly<{
  buildingKey: string;
  buildingName: string;
  locale?: 'en' | 'ko' | 'zh-CN';
  variant?: 'row' | 'detail';
}>) {
  const raw = useSyncExternalStore(subscribeSavedSearch, readSavedSearch, serverSnapshot);
  const savedSearch = useMemo(() => parseSavedSearch(raw), [raw]);
  const [message, setMessage] = useState('');
  const saved = savedSearch.buildings.some(({ key }) => key === buildingKey);
  const action = saved
    ? (locale === 'ko' ? `${buildingName} 관심 해제` : locale === 'zh-CN' ? `取消收藏${buildingName}` : `Remove ${buildingName}`)
    : (locale === 'ko' ? `${buildingName} 저장` : locale === 'zh-CN' ? `收藏${buildingName}` : `Save ${buildingName}`);

  const toggle = () => {
    if (saved) {
      const persisted = writeSavedSearch({
        ...savedSearch,
        buildings: savedSearch.buildings.filter(({ key }) => key !== buildingKey),
      });
      setMessage(persisted ? (locale === 'ko' ? '관심 목록에서 해제했습니다.' : locale === 'zh-CN' ? '已取消收藏。': 'Removed from Saved.') : (locale === 'ko' ? '브라우저 저장이 차단되어 이번 페이지에서만 유지됩니다.' : locale === 'zh-CN' ? '浏览器存储被阻止，更改仅在当前页面会话中保留。': 'Browser storage is blocked. Changes last only for this page session.'));
      return;
    }
    if (savedSearch.buildings.length >= 30) {
      setMessage(locale === 'ko' ? '관심 건물은 최대 30개까지 저장할 수 있습니다.' : locale === 'zh-CN' ? '最多可收藏30个楼盘。': 'You can save up to 30 buildings.');
      return;
    }
    const persisted = writeSavedSearch({
      ...savedSearch,
      buildings: [...savedSearch.buildings, {
        key: buildingKey,
        name: buildingName,
        signatures: [],
        checkedAt: new Date().toISOString(),
      }],
    });
    setMessage(persisted ? (locale === 'ko' ? '관심 목록에 저장했습니다.' : locale === 'zh-CN' ? '已收藏到此浏览器。': 'Saved in this browser.') : (locale === 'ko' ? '브라우저 저장이 차단되어 이번 페이지에서만 유지됩니다.' : locale === 'zh-CN' ? '浏览器存储被阻止，更改仅在当前页面会话中保留。': 'Browser storage is blocked. Changes last only for this page session.'));
  };

  return <span className={styles.control} data-save-variant={variant}>
    <button
      type="button"
      className={styles.button}
      aria-label={action}
      aria-pressed={saved}
      data-building-save={buildingKey}
      onClick={toggle}
    >
      <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
      <span>{saved ? (locale === 'ko' ? '저장됨' : locale === 'zh-CN' ? '已收藏': 'Saved') : (locale === 'ko' ? '저장' : locale === 'zh-CN' ? '收藏': 'Save')}</span>
    </button>
    <span className={styles.status} role="status">{message}</span>
  </span>;
}
