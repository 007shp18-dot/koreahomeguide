'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import styles from './building-street-view.module.css';

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
  if (opened) return market === 'seoul'
    ? <NaverView locale={locale} clientId={providerKey} buildingName={buildingName}
        latitude={latitude} longitude={longitude} addressQuery={address} mapHref={mapHref} />
    : <GoogleView locale={locale} browserKey={providerKey} buildingName={buildingName}
        latitude={latitude} longitude={longitude} address={address} mapHref={mapHref} />;

  return <section className={styles.locationFallback} data-building-media="nearby-view-on-demand">
    <span aria-hidden="true">⌖</span>
    <div><strong>{buildingName}</strong>
      {address ? <p>{address}</p> : null}
      <p>{locale === 'ko' ? '건물 주변을 거리뷰로 둘러보세요.' : locale === 'zh-CN'
        ? '通过街景浏览楼宇周边。' : 'Explore the streets around this building.'}</p>
    </div>
    {providerKey ? <button className={styles.nearbyButton} type="button" onClick={() => setOpened(true)}>
      {locale === 'ko' ? '주변 거리뷰 보기' : locale === 'zh-CN' ? '查看周边街景' : 'View nearby streets'}
    </button> : <a href={mapHref}>{locale === 'ko' ? '지도에서 보기' : locale === 'zh-CN' ? '查看地图' : 'View on map'}</a>}
  </section>;
}
