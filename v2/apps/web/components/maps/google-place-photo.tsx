'use client';

import Script from 'next/script';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import {
  buildGoogleMapsScriptUrl,
  GOOGLE_MAPS_READY_CALLBACK,
} from './google-place-map';
import styles from './building-street-view.module.css';

const GOOGLE_MAPS_READY_EVENT = 'signedprice:google-maps-ready';
const GOOGLE_MAPS_READY_FLAG = '__signedpriceGoogleMapsLoaded';

type GoogleAuthorAttribution = Readonly<{
  displayName: string;
  uri: string | null;
}>;

type GooglePlacePhotoResult = Readonly<{
  getURI: (options: Readonly<{ maxHeight: number; maxWidth: number }>) => string;
  authorAttributions: readonly GoogleAuthorAttribution[];
}>;

type GooglePlaceResult = Readonly<{
  photos?: readonly GooglePlacePhotoResult[];
}>;

type GooglePlaceClass = Readonly<{
  searchByText: (request: Readonly<{
    textQuery: string;
    fields: readonly string[];
    maxResultCount: number;
    language: string;
  }>) => Promise<Readonly<{ places: readonly GooglePlaceResult[] }>>;
}>;

type GooglePlacesLibrary = Readonly<{ Place: GooglePlaceClass }>;
type GooglePlacesSdk = Readonly<{
  importLibrary: (library: 'places') => Promise<GooglePlacesLibrary>;
}>;

type GoogleReadyScope = Window & {
  google?: Readonly<{ maps: GooglePlacesSdk }>;
  [GOOGLE_MAPS_READY_FLAG]?: boolean;
};

type PhotoState = Readonly<{
  src: string;
  attribution: GoogleAuthorAttribution | null;
}> | 'loading' | 'unavailable';

export function GooglePlacePhoto({
  browserKey,
  buildingName,
  address,
  fallback,
}: Readonly<{
  browserKey: string | null;
  buildingName: string;
  address: string;
  fallback: ReactNode;
}>) {
  const [photo, setPhoto] = useState<PhotoState>('loading');

  const initialize = useCallback(async () => {
    const sdk = (window as GoogleReadyScope).google?.maps;
    if (sdk === undefined || typeof sdk.importLibrary !== 'function') return;
    try {
      const { Place } = await sdk.importLibrary('places');
      const { places } = await Place.searchByText({
        textQuery: `${buildingName}, ${address}`,
        fields: ['id', 'displayName', 'photos'],
        maxResultCount: 1,
        language: 'en',
      });
      const result = places[0]?.photos?.[0];
      if (result === undefined) {
        setPhoto('unavailable');
        return;
      }
      setPhoto(Object.freeze({
        src: result.getURI({ maxHeight: 900, maxWidth: 1400 }),
        attribution: result.authorAttributions[0] ?? null,
      }));
    } catch {
      setPhoto('unavailable');
    }
  }, [address, buildingName]);

  useEffect(() => {
    if (browserKey === null) return;
    const scope = window as GoogleReadyScope;
    const handleReady = () => { void initialize(); };
    window.addEventListener(GOOGLE_MAPS_READY_EVENT, handleReady);
    if (scope[GOOGLE_MAPS_READY_FLAG] === true || scope.google?.maps !== undefined) {
      queueMicrotask(handleReady);
    }
    return () => window.removeEventListener(GOOGLE_MAPS_READY_EVENT, handleReady);
  }, [browserKey, initialize]);

  if (browserKey === null || photo === 'unavailable') return fallback;

  return (
    <section className={styles.frame} data-building-media="google-place-photo" data-media-state={photo === 'loading' ? 'loading' : 'ready'}>
      {photo === 'loading' ? (
        <div className={styles.loading} aria-live="polite"><span>Loading verified place photo</span><strong>{buildingName}</strong></div>
      ) : (
        // Google Place photo URIs are ephemeral and must not be cached or
        // transformed by Next Image according to the provider terms.
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.photo} src={photo.src} alt={`${buildingName} place photo`} />
      )}
      {photo === 'loading' ? null : (
        <p className={styles.label}>
          Place photo · Google
          {photo.attribution === null ? null : photo.attribution.uri === null
            ? ` · ${photo.attribution.displayName}`
            : <> · <a href={photo.attribution.uri}>{photo.attribution.displayName}</a></>}
        </p>
      )}
      <Script
        src={buildGoogleMapsScriptUrl(browserKey)}
        strategy="lazyOnload"
        onReady={() => { void initialize(); }}
        onError={() => setPhoto('unavailable')}
        data-google-photo-loader={GOOGLE_MAPS_READY_CALLBACK}
      />
    </section>
  );
}
