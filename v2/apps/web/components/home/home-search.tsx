'use client';

import { useState } from 'react';
import Form from 'next/form';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import styles from '../design-review/editorial-growth-home.module.css';

const CITIES = [
  { id: 'seoul', en: 'Seoul', ko: '서울', zh: '首尔', href: '/kr/seoul/explore/' },
  { id: 'singapore', en: 'Singapore', ko: '싱가포르', zh: '新加坡', href: '/sg/singapore/explore/' },
  { id: 'dubai', en: 'Dubai', ko: '두바이', zh: '迪拜', href: '/ae/dubai/explore/' },
  { id: 'tokyo', en: 'Tokyo', ko: '도쿄', zh: '东京', href: '/jp/tokyo/explore/' },
] as const;

export function HomeSearch({ locale }: Readonly<{ locale: SiteLocale }>) {
  const [city, setCity] = useState('seoul');
  const selected = CITIES.find(item => item.id === city) ?? CITIES[0];
  const ko = locale === 'ko', zh = locale === 'zh-CN';
  const action = `${ko && city !== 'tokyo' ? '/ko' : ''}${selected.href}`;
  return <Form action={action} role="search" className={styles.search}>
    <label className={styles.cityField}><span>{ko ? '도시' : zh ? '城市' : 'City'}</span>
      <select aria-label={ko ? '도시 선택' : zh ? '选择城市' : 'Choose city'} value={city} onChange={event => setCity(event.target.value)}>
        {CITIES.map(item => <option key={item.id} value={item.id}>{ko ? item.ko : zh ? item.zh : item.en}</option>)}
      </select>
    </label>
    <label className={styles.searchField}><span>{ko ? '지역·건물' : zh ? '区域或建筑' : 'Where'}</span>
      <input key={city} name="q" type="search" maxLength={100} autoComplete="off"
        aria-label={ko ? (city === 'tokyo' ? '도쿄 지역 검색' : '지역 또는 건물 검색') : zh ? '搜索地区或建筑' : city === 'tokyo' ? 'Tokyo neighbourhood' : 'Neighbourhood or building'}
        placeholder={ko ? (city === 'tokyo' ? '지역명 (영문 자료)' : '지역명 또는 건물명') : zh ? '地区或建筑名称' : city === 'tokyo' ? 'Neighbourhood' : 'Neighbourhood or building'} />
    </label>
    <button type="submit" aria-label={ko ? '선택 도시 탐색' : zh ? '探索所选城市' : 'Explore selected city'}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
    </button>
  </Form>;
}
