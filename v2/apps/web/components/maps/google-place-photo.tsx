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
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  photos?: readonly GooglePlacePhotoResult[];
}>;

type GooglePlaceClass = {
  new(options: { id: string }): GooglePlaceResult & {
    fetchFields: (request: { fields: readonly string[] }) => Promise<unknown>;
  };
  searchByText: (request: Readonly<{
    textQuery: string;
    fields: readonly string[];
    maxResultCount: number;
    language: string;
  }>) => Promise<Readonly<{ places: readonly GooglePlaceResult[] }>>;
};

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

export async function findGooglePlacePhoto(
  Place: GooglePlaceClass,
  approvedPlaceId: string | null,
  buildingName: string,
  address: string,
): Promise<GooglePlacePhotoResult | null> {
  if (approvedPlaceId !== null) {
    const place = new Place({ id: approvedPlaceId });
    await place.fetchFields({ fields: ['photos'] });
    return place.photos?.[0] ?? null;
  }
  const { places } = await Place.searchByText({
    textQuery: `${buildingName}, ${address}`,
    fields: ['id', 'displayName', 'formattedAddress', 'photos'],
    maxResultCount: 1,
    language: 'en',
  });
  const place = places[0];
  return isTrustedGooglePlaceMatch(place?.displayName, buildingName, place?.formattedAddress, address)
    ? place?.photos?.[0] ?? null : null;
}

type GooglePlacePhotoProps = Readonly<{
  browserKey: string | null;
  buildingName: string;
  address: string;
  fallback: ReactNode;
  linkAttribution?: boolean;
  registryKey?: string;
  /** Only a server-published, exact-property approval may supply this ID. */
  verifiedPlaceId?: string;
}>;

export function GooglePlacePhoto(props: GooglePlacePhotoProps) {
  // Reset approval and in-flight state when navigating between properties.
  // Requests belonging to an unmounted identity cannot update the new photo.
  return <GooglePlacePhotoForIdentity
    key={JSON.stringify([props.registryKey, props.verifiedPlaceId, props.buildingName, props.address, props.browserKey])}
    {...props}
  />;
}

function GooglePlacePhotoForIdentity({
  browserKey,
  buildingName,
  address,
  fallback,
  linkAttribution = true,
  registryKey,
  verifiedPlaceId,
}: GooglePlacePhotoProps) {
  const [photo, setPhoto] = useState<PhotoState>('loading');
  const [approvedPlaceId, setApprovedPlaceId] = useState<string | null | undefined>(
    verifiedPlaceId ?? (registryKey === undefined ? null : undefined),
  );

  useEffect(() => {
    if (registryKey === undefined) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setPhoto('loading');
      setApprovedPlaceId(undefined);
    });
    void (async () => {
      try {
        const response = await fetch(`/api/building-photo/?key=${encodeURIComponent(registryKey)}`);
        if (!response.ok) throw new Error('Photo approval unavailable.');
        const approval = await response.json() as Readonly<{
          state?: unknown;
          provider?: unknown;
          placeId?: unknown;
          assetUrl?: unknown;
          attributionName?: unknown;
          attributionUrl?: unknown;
          buildingName?: unknown;
          address?: unknown;
        }>;
        if (approval.state !== 'approved'
          || typeof approval.buildingName !== 'string' || typeof approval.address !== 'string'
          || normalizedPlaceText(approval.buildingName) !== normalizedPlaceText(buildingName)
          || normalizedPlaceText(approval.address) !== normalizedPlaceText(address)) {
          throw new Error('Photo identity is not approved.');
        }
        if ((approval.provider === 'licensed-url' || approval.provider === 'owned-object')
          && typeof approval.assetUrl === 'string') {
          if (!active) return;
          setPhoto(Object.freeze({
            src: approval.assetUrl,
            attribution: typeof approval.attributionName === 'string'
              ? Object.freeze({
                displayName: approval.attributionName,
                uri: typeof approval.attributionUrl === 'string' ? approval.attributionUrl : null,
              })
              : null,
          }));
          return;
        }
        if (approval.provider !== 'google-place' || typeof approval.placeId !== 'string') {
          throw new Error('Approved photo provider is incomplete.');
        }
        if (browserKey === null) throw new Error('Google Places browser key unavailable.');
        if (active) setApprovedPlaceId(approval.placeId);
      } catch {
        if (active) setPhoto('unavailable');
      }
    })();
    return () => { active = false; };
  }, [address, browserKey, buildingName, registryKey]);

  const initialize = useCallback(async () => {
    const sdk = (window as GoogleReadyScope).google?.maps;
    if (sdk === undefined || typeof sdk.importLibrary !== 'function' || approvedPlaceId === undefined) return;
    try {
      const { Place } = await sdk.importLibrary('places');
      const result = await findGooglePlacePhoto(Place, approvedPlaceId, buildingName, address);
      if (result === null) {
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
  }, [address, approvedPlaceId, buildingName]);

  useEffect(() => {
    if (browserKey === null || approvedPlaceId === undefined) return;
    const scope = window as GoogleReadyScope;
    const handleReady = () => { void initialize(); };
    const timeout = window.setTimeout(() => setPhoto((current) => current === 'loading' ? 'unavailable' : current), 5_000);
    window.addEventListener(GOOGLE_MAPS_READY_EVENT, handleReady);
    if (scope[GOOGLE_MAPS_READY_FLAG] === true || scope.google?.maps !== undefined) {
      queueMicrotask(handleReady);
    }
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener(GOOGLE_MAPS_READY_EVENT, handleReady);
    };
  }, [approvedPlaceId, browserKey, initialize]);

  if (photo === 'unavailable' || (browserKey === null && registryKey === undefined)) return fallback;

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
      {photo === 'loading' || photo.attribution === null ? null : (
        <p className={styles.attribution} aria-label="Photo credit">
          {photo.attribution.uri === null || !linkAttribution
            ? photo.attribution.displayName
            : <a href={photo.attribution.uri}>{photo.attribution.displayName}</a>}
        </p>
      )}
      {browserKey === null || approvedPlaceId === undefined ? null : (
        <Script
          src={buildGoogleMapsScriptUrl(browserKey)}
          strategy="lazyOnload"
          onReady={() => { void initialize(); }}
          onError={() => setPhoto('unavailable')}
          data-google-photo-loader={GOOGLE_MAPS_READY_CALLBACK}
        />
      )}
    </div>
  );
}
