'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import styles from './building-street-view.module.css';
import { seoulBuildingViewMode } from './building-nearby-view-policy';

// Import and mount provider SDK consumers only after an explicit click.
const NaverView = dynamic(() => import('./naver-building-street-view').then(m => m.NaverBuildingStreetView));
const GoogleView = dynamic(() => import('./google-building-street-view').then(m => m.GoogleBuildingStreetView));

export function BuildingNearbyView({ locale = 'en', market, providerKey, buildingName, address,
  latitude, longitude, mapHref,
}: Readonly<{
  locale?: 'en' | 'ko' | 'zh-CN';
  market: 'seoul' | 'singapore';
  providerKey: string | null;
  buildingName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  mapHref: string;
}>) {
  const [opened, setOpened] = useState(false);
  const viewMode = market === 'seoul' ? seoulBuildingViewMode(buildingName) : 'panorama';
  if (opened) return market === 'seoul'
    ? <NaverView locale={locale} clientId={providerKey} buildingName={buildingName}
        latitude={latitude} longitude={longitude} addressQuery={address} mapHref={mapHref}
        preferMap={viewMode === 'map'} />
    : <GoogleView locale={locale} browserKey={providerKey} buildingName={buildingName}
        latitude={latitude} longitude={longitude} address={address} mapHref={mapHref} />;

  return <section className={styles.locationFallback} data-building-media="nearby-view-on-demand" data-location-fallback="true">
    <span aria-hidden="true">⌖</span>
    <div><strong>{buildingName}</strong>
      {address ? <p>{address}</p> : null}
      <p>{viewMode === 'map'
        ? (locale === 'ko' ? '정확한 단지 위치를 지도에서 확인하세요.' : locale === 'zh-CN'
          ? '在地图上查看准确的楼宇位置。' : 'View the precise building location on the map.')
        : (locale === 'ko' ? '건물 주변을 거리뷰로 둘러보세요.' : locale === 'zh-CN'
          ? '通过街景浏览楼宇周边。' : 'Explore the streets around this building.')}</p>
    </div>
    {providerKey ? <button className={styles.nearbyButton} type="button" onClick={() => setOpened(true)}>
      {viewMode === 'map'
        ? (locale === 'ko' ? '단지 위치 보기' : locale === 'zh-CN' ? '查看楼宇位置' : 'View building location')
        : (locale === 'ko' ? '주변 거리뷰 보기' : locale === 'zh-CN' ? '查看周边街景' : 'View nearby streets')}
    </button> : <a href={mapHref}>{locale === 'ko' ? '지도에서 보기' : locale === 'zh-CN' ? '查看地图' : 'View location on map'}</a>}
  </section>;
}
