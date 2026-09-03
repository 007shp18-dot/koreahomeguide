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
  displayName?: string;
  formattedAddress?: string;
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

function normalizedPlaceText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, '');
}

/**
 * A text search can return a nearby landmark or streetscape. Only accept a
 * photo when Google's place name still agrees with the requested identity.
 */
export function isTrustedGooglePlaceMatch(
  displayName: string | undefined,
  buildingName: string,
  formattedAddress?: string,
  requestedAddress?: string,
): boolean {
  if (displayName === undefined) return false;
  const place = normalizedPlaceText(displayName);
  const building = normalizedPlaceText(buildingName);
  if (place.length < 3 || building.length < 3) return false;
  if (!(place.includes(building) || building.includes(place))) return false;
  if (formattedAddress === undefined || requestedAddress === undefined) return true;
  const requestedTokens = requestedAddress.normalize('NFKC').split(/[^\p{L}\p{N}]+/gu)
    .map(normalizedPlaceText)
    .filter((token) => token.length >= 2 && /[가-힣]/u.test(token));
  if (requestedTokens.length === 0) return true;
  const returned = normalizedPlaceText(formattedAddress);
  return requestedTokens.some((token) => returned.includes(token));
}

export function GooglePlacePhoto({
  browserKey,
  buildingName,
  address,
  fallback,
  linkAttribution = true,
}: Readonly<{
  browserKey: string | null;
  buildingName: string;
  address: string;
  fallback: ReactNode;
  linkAttribution?: boolean;
}>) {
  const [photo, setPhoto] = useState<PhotoState>('loading');

  const initialize = useCallback(async () => {
    const sdk = (window as GoogleReadyScope).google?.maps;
    if (sdk === undefined || typeof sdk.importLibrary !== 'function') return;
    try {
      const { Place } = await sdk.importLibrary('places');
      const { places } = await Place.searchByText({
        textQuery: `${buildingName}, ${address}`,
        fields: ['id', 'displayName', 'formattedAddress', 'photos'],
        maxResultCount: 1,
        language: 'en',
      });
      const place = places[0];
      const result = place?.photos?.[0];
      if (result === undefined || !isTrustedGooglePlaceMatch(place?.displayName, buildingName, place?.formattedAddress, address)) {
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
    <div className={styles.frame} data-building-media="google-place-photo" data-media-state={photo === 'loading' ? 'loading' : 'ready'}>
      {photo === 'loading' ? (
        <div className={styles.loading} aria-live="polite"><span>Loading verified place photo</span><strong>{buildingName}</strong></div>
      ) : (
        // Google Place photo URIs are ephemeral and must not be cached or
        // transformed by Next Image according to the provider terms.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.photo}
          src={photo.src}
          alt={`${buildingName} place photo`}
          decoding="async"
          onError={() => setPhoto('unavailable')}
        />
      )}
      {photo === 'loading' ? null : (
        <p className={styles.label}>
          Place photo · Google
          {photo.attribution === null ? null : photo.attribution.uri === null || !linkAttribution
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
    </div>
  );
}
