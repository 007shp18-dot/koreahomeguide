'use client';

import Script from 'next/script';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import {
  buildGoogleMapsScriptUrl,
  GOOGLE_MAPS_READY_CALLBACK,
} from './google-place-map';
import styles from './building-street-view.module.css';
import photoStyles from './property-photo.module.css';

const GOOGLE_MAPS_READY_EVENT = 'signedprice:google-maps-ready';
const GOOGLE_MAPS_READY_FLAG = '__signedpriceGoogleMapsLoaded';

type GoogleAuthorAttribution = Readonly<{
  displayName: string;
  uri: string | null;
}>;

export type GooglePlacePhotoResult = Readonly<{
  getURI: (options: Readonly<{ maxHeight: number; maxWidth: number }>) => string;
  authorAttributions: readonly GoogleAuthorAttribution[];
}>;

type GooglePlaceResult = Readonly<{
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  photos?: readonly GooglePlacePhotoResult[];
}>;

export type GooglePlaceClass = {
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

type DisplayPhoto = Readonly<{
  src: string;
  attributions: readonly GoogleAuthorAttribution[];
}>;

type PhotoSubjectKind = 'building-exterior' | 'building-front' | 'site-aerial' | 'map-only';
type ApprovedPhotoProvider = 'google-place' | 'licensed-url' | 'owned-object';
type PhotoLabel = 'Verified place photos' | 'Verified building photograph' | 'Verified project or estate photograph';

type PhotoState = Readonly<{
  items: readonly DisplayPhoto[];
  label: PhotoLabel;
  sourcePageUrl?: string | null;
}> | 'loading' | 'unavailable';

export function photoApprovalLabel(
  subjectKind: PhotoSubjectKind,
  provider: ApprovedPhotoProvider,
): PhotoLabel {
  if (subjectKind === 'site-aerial') return 'Verified project or estate photograph';
  return provider === 'google-place' ? 'Verified place photos' : 'Verified building photograph';
}

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

export async function findGooglePlacePhotos(
  Place: GooglePlaceClass,
  approvedPlaceId: string | null,
  maximum = 5,
): Promise<readonly GooglePlacePhotoResult[]> {
  if (approvedPlaceId === null) return Object.freeze([]);
  const place = new Place({ id: approvedPlaceId });
  await place.fetchFields({ fields: ['photos'] });
  const boundedMaximum = Math.min(Math.max(Math.floor(maximum), 1), 5);
  return Object.freeze([...(place.photos ?? [])].slice(0, boundedMaximum));
}

export async function findGooglePlacePhoto(
  Place: GooglePlaceClass,
  approvedPlaceId: string | null,
  buildingName: string,
  address: string,
): Promise<GooglePlacePhotoResult | null> {
  void buildingName;
  void address;
  return (await findGooglePlacePhotos(Place, approvedPlaceId, 1))[0] ?? null;
}

type GooglePlacePhotoProps = Readonly<{
  locale?: 'en' | 'ko';
  browserKey: string | null;
  buildingName: string;
  /** Presentation only; approval identity always uses buildingName. */
  displayBuildingName?: string;
  address: string;
  fallback: ReactNode;
  linkAttribution?: boolean;
  registryKey?: string;
  /** Only a server-published, exact-property approval may supply this ID. */
  verifiedPlaceId?: string;
  verifiedSubjectKind?: PhotoSubjectKind;
  expectedBuildingKey?: string;
}>;

export function GooglePlacePhoto(props: GooglePlacePhotoProps) {
  // Reset approval and in-flight state when navigating between properties.
  // Requests belonging to an unmounted identity cannot update the new photo.
  return <GooglePlacePhotoForIdentity
    key={JSON.stringify([props.registryKey, props.verifiedPlaceId, props.verifiedSubjectKind, props.expectedBuildingKey, props.buildingName, props.address, props.browserKey])}
    {...props}
  />;
}

function GooglePlacePhotoForIdentity({
  locale = 'en',
  browserKey,
  buildingName,
  displayBuildingName = buildingName,
  address,
  fallback,
  linkAttribution = true,
  registryKey,
  verifiedPlaceId,
  verifiedSubjectKind = 'building-exterior',
  expectedBuildingKey,
}: GooglePlacePhotoProps) {
  const [photo, setPhoto] = useState<PhotoState>('loading');
  const [activePhoto, setActivePhoto] = useState(0);
  const [approvedSubjectKind, setApprovedSubjectKind] = useState<PhotoSubjectKind>(verifiedSubjectKind);
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
          subjectKind?: unknown;
          placeId?: unknown;
          assetUrl?: unknown;
          attributionName?: unknown;
          attributionUrl?: unknown;
          sourcePageUrl?: unknown;
          buildingName?: unknown;
          buildingKey?: unknown;
          address?: unknown;
        }>;
        const expectedAddress = normalizedPlaceText(address);
        if (approval.state !== 'approved'
          || (expectedBuildingKey !== undefined && approval.buildingKey !== expectedBuildingKey)
          || typeof approval.buildingName !== 'string' || typeof approval.address !== 'string'
          || normalizedPlaceText(approval.buildingName) !== normalizedPlaceText(buildingName)
          || (expectedAddress.length > 0
            && normalizedPlaceText(approval.address) !== expectedAddress)) {
          throw new Error('Photo identity is not approved.');
        }
        if ((approval.provider === 'licensed-url' || approval.provider === 'owned-object')
          && typeof approval.assetUrl === 'string') {
          if (!active) return;
          setPhoto(Object.freeze({
            sourcePageUrl: typeof approval.sourcePageUrl === 'string' ? approval.sourcePageUrl : null,
            label: photoApprovalLabel(
              approval.subjectKind === 'site-aerial' ? 'site-aerial' : 'building-exterior',
              approval.provider,
            ),
            items: Object.freeze([Object.freeze({
              src: approval.assetUrl,
              attributions: typeof approval.attributionName === 'string'
                ? Object.freeze([Object.freeze({
                displayName: approval.attributionName,
                uri: typeof approval.attributionUrl === 'string' ? approval.attributionUrl : null,
                })])
                : Object.freeze([]),
            })]),
          }));
          return;
        }
        if (approval.provider !== 'google-place' || typeof approval.placeId !== 'string') {
          throw new Error('Approved photo provider is incomplete.');
        }
        if (browserKey === null) throw new Error('Google Places browser key unavailable.');
        if (active) {
          setApprovedSubjectKind(approval.subjectKind === 'site-aerial' ? 'site-aerial' : 'building-exterior');
          setApprovedPlaceId(approval.placeId);
        }
      } catch {
        if (active) setPhoto('unavailable');
      }
    })();
    return () => { active = false; };
  }, [address, browserKey, buildingName, expectedBuildingKey, registryKey]);

  const initialize = useCallback(async () => {
    const sdk = (window as GoogleReadyScope).google?.maps;
    if (sdk === undefined || typeof sdk.importLibrary !== 'function' || approvedPlaceId === undefined) return;
    try {
      const { Place } = await sdk.importLibrary('places');
      const results = await findGooglePlacePhotos(Place, approvedPlaceId, 5);
      if (results.length === 0) {
        setPhoto('unavailable');
        return;
      }
      setPhoto(Object.freeze({
        label: photoApprovalLabel(approvedSubjectKind, 'google-place'),
        items: Object.freeze(results.map((result) => Object.freeze({
          src: result.getURI({ maxHeight: 900, maxWidth: 1400 }),
          attributions: Object.freeze([...result.authorAttributions]),
        }))),
      }));
    } catch {
      setPhoto('unavailable');
    }
  }, [approvedPlaceId, approvedSubjectKind]);

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

  const current = photo === 'loading' ? null : photo.items[activePhoto] ?? photo.items[0] ?? null;
  const secondary = photo === 'loading' ? [] : photo.items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => index !== activePhoto)
    .slice(0, 4);

  return (
    <figure className={photoStyles.frame} data-building-media="google-place-photo" data-media-state={photo === 'loading' ? 'loading' : 'ready'}>
      <div className={photoStyles.stage}>
      {photo === 'loading' && verifiedPlaceId !== undefined
        ? <p className={styles.photoLabel}>{locale === 'ko' ? '확인된 장소 사진' : 'Verified place photos'}</p>
        : null}
      {photo === 'loading' ? (
        <div className={styles.loading} aria-live="polite"><span>{locale === 'ko' ? '확인된 장소 사진을 불러오는 중' : 'Loading verified place photo'}</span><strong>{displayBuildingName}</strong></div>
      ) : current === null ? null : (
        // Google Place photo URIs are ephemeral and must not be cached or
        // transformed by Next Image according to the provider terms.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.photo}
          src={current.src}
          alt={locale === 'ko' ? `${displayBuildingName} 장소 사진 ${activePhoto + 1}` : `${displayBuildingName} place photo ${activePhoto + 1}`}
          decoding="async"
          onError={() => setPhoto('unavailable')}
        />
      )}
      {photo === 'loading' ? null : <>
        {secondary.length === 0 ? null : <div className={styles.photoStrip} aria-label={locale === 'ko' ? '확인된 장소 사진 더 보기' : 'More verified place photos'}>
          {secondary.map(({ item, index }) => <button
            type="button"
            key={`${item.src}:${index}`}
            onClick={() => setActivePhoto(index)}
            aria-label={locale === 'ko' ? `${index + 1}번 사진 보기` : `Show photo ${index + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt="" decoding="async" />
          </button>)}
        </div>}
      </>}
      </div>
      {photo === 'loading' ? null : <figcaption className={photoStyles.caption}>
        <span className={photoStyles.relationship}>{locale === 'ko' ? { 'Verified place photos': '확인된 장소 사진', 'Verified building photograph': '확인된 건물 사진', 'Verified project or estate photograph': '확인된 단지 사진' }[photo.label] : photo.label}</span>
        {current === null ? null : (
          <span className={photoStyles.credit} aria-label={locale === 'ko' ? '사진 출처' : 'Photo credit'}>
            {current.attributions.map((attribution, index) => <span key={`${attribution.displayName}:${index}`}>
              {index === 0 ? null : ' · '}
              {attribution.uri === null || !linkAttribution
                ? attribution.displayName
                : <a href={attribution.uri}>{attribution.displayName}</a>}
            </span>)}
            {photo.sourcePageUrl && !current.attributions.some(a => a.uri === photo.sourcePageUrl)
              ? <a href={photo.sourcePageUrl} rel="noreferrer">{locale === 'ko' ? '원본 사진' : 'Photo source'}</a> : null}
          </span>
        )}
      </figcaption>}
      {browserKey === null || approvedPlaceId === undefined ? null : (
        <Script
          src={buildGoogleMapsScriptUrl(browserKey, 'singapore', locale)}
          strategy="lazyOnload"
          onReady={() => { void initialize(); }}
          onError={() => setPhoto('unavailable')}
          data-google-photo-loader={GOOGLE_MAPS_READY_CALLBACK}
        />
      )}
    </figure>
  );
}
