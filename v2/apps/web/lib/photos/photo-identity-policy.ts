export type PhotoMarket = 'seoul' | 'singapore';

export type PhotoLocation = Readonly<{
  latitude: number;
  longitude: number;
}>;

export type PhotoIdentityInput = Readonly<{
  market: PhotoMarket;
  canonicalName: string;
  aliases: readonly string[];
  address: string;
  postalCode: string | null;
  entityLocation: PhotoLocation | null;
  providerName: string;
  providerAddress: string;
  providerLocation: PhotoLocation | null;
  hasPhoto: boolean;
}>;

export type PhotoIdentityDecision = Readonly<{
  disposition: 'auto-approve' | 'review' | 'reject';
  confidence: number;
  policyVersion: 'photo-identity-v2';
  evidence: readonly string[];
}>;

const POLICY_VERSION = 'photo-identity-v2' as const;

function normalized(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, '');
}

function words(value: string): readonly string[] {
  return value.normalize('NFKC').toLocaleLowerCase('en-US')
    .split(/[^\p{L}\p{N}]+/gu)
    .filter(Boolean);
}

function exactNameMatches(input: PhotoIdentityInput): boolean {
  const provider = normalized(input.providerName);
  if (provider.length < 2) return false;
  return [input.canonicalName, ...input.aliases]
    .some((name) => normalized(name) === provider);
}

function nameMatches(input: PhotoIdentityInput): boolean {
  if (exactNameMatches(input)) return true;
  const provider = normalized(input.providerName);
  if (provider.length < 5) return false;
  return [input.canonicalName, ...input.aliases].some((name) => {
    const candidate = normalized(name);
    return candidate.length >= 5 && (provider.includes(candidate) || candidate.includes(provider));
  });
}

function explicitNumberConflict(input: PhotoIdentityInput): boolean {
  const entityNumbers = new Set(words(input.canonicalName).filter((token) => /^\d+[a-z]?$/u.test(token)));
  const providerNumbers = new Set(words(input.providerName).filter((token) => /^\d+[a-z]?$/u.test(token)));
  if (entityNumbers.size === 0 || providerNumbers.size === 0) return false;
  return [...entityNumbers].every((token) => !providerNumbers.has(token));
}

function countryEvidence(market: PhotoMarket, providerAddress: string): Readonly<{
  matches: boolean;
  conflicts: boolean;
}> {
  const value = providerAddress.normalize('NFKC').toLocaleLowerCase('en-US');
  if (market === 'singapore') {
    return Object.freeze({
      matches: /\bsingapore\b/u.test(value),
      conflicts: /\b(?:united kingdom|england|london|malaysia|indonesia|australia|united states)\b/u.test(value)
        && !/\bsingapore\b/u.test(value),
    });
  }
  const korea = /(?:대한민국|한국|서울(?:특별시)?)|\b(?:seoul|korea|south korea)\b/u.test(value);
  return Object.freeze({
    matches: korea,
    conflicts: /\b(?:singapore|united kingdom|england|london|japan|china|united states)\b/u.test(value)
      && !korea,
  });
}

const SINGAPORE_ADDRESS_WORDS = new Set([
  'singapore', 'street', 'st', 'road', 'rd', 'avenue', 'ave', 'drive', 'dr',
  'lane', 'ln', 'walk', 'way', 'close', 'crescent', 'block', 'blk', 'place',
  'pl', 'terrace', 'ter', 'boulevard', 'blvd',
]);

function addressNumbers(input: PhotoIdentityInput, value: string): readonly string[] {
  const postal = input.postalCode === null ? null : normalized(input.postalCode);
  return words(value)
    .filter((token) => /^\d+[a-z]?$/u.test(token))
    .map(normalized)
    .filter((token) => token !== postal);
}

function addressNumberConflict(input: PhotoIdentityInput): boolean {
  const entityNumbers = addressNumbers(input, input.address);
  const providerNumbers = new Set(addressNumbers(input, input.providerAddress));
  return entityNumbers.length > 0 && providerNumbers.size > 0
    && entityNumbers.some((token) => !providerNumbers.has(token));
}

function exactAddressMatches(input: PhotoIdentityInput): boolean {
  const provider = normalized(input.providerAddress);
  const entityNumbers = addressNumbers(input, input.address);
  if (!entityNumbers.every((token) => provider.includes(token))) return false;
  if (input.market === 'singapore') {
    const streetTokens = words(input.address)
      .filter((token) => !SINGAPORE_ADDRESS_WORDS.has(token) && !/^\d+[a-z]?$/u.test(token))
      .filter((token) => token.length >= 3);
    return streetTokens.length > 0
      && streetTokens.every((token) => provider.includes(normalized(token)));
  }
  const ignored = new Set(['대한민국', '한국', '서울', '서울특별시']);
  const locationTokens = words(input.address)
    .filter((token) => !ignored.has(token) && /[가-힣]/u.test(token) && token.length >= 2);
  return locationTokens.length >= 2
    && locationTokens.every((token) => provider.includes(normalized(token)));
}

function postalMatches(input: PhotoIdentityInput): boolean {
  if (input.postalCode === null || input.postalCode.trim() === '') return false;
  return normalized(input.providerAddress).includes(normalized(input.postalCode));
}

function postalConflicts(input: PhotoIdentityInput): boolean {
  if (input.postalCode === null || input.postalCode.trim() === '') return false;
  const expected = normalized(input.postalCode);
  const sameLengthNumbers = words(input.providerAddress)
    .map(normalized)
    .filter((token) => /^\d+$/u.test(token) && token.length === expected.length);
  return sameLengthNumbers.length > 0 && !sameLengthNumbers.includes(expected);
}

function localityTokens(value: string, market: PhotoMarket): readonly string[] {
  const ignored = market === 'singapore'
    ? new Set(['singapore', 'street', 'st', 'road', 'rd', 'avenue', 'ave', 'drive', 'dr', 'lane', 'ln', 'walk', 'way', 'close', 'crescent', 'block', 'blk'])
    : new Set(['대한민국', '서울', '서울특별시']);
  return words(value).filter((token) => {
    if (ignored.has(token) || /^\d+$/u.test(token)) return false;
    if (market === 'singapore') return token.length >= 4;
    return /[가-힣]/u.test(token) && (token.length >= 2 || /[구동로길]$/u.test(token));
  });
}

function localityMatches(input: PhotoIdentityInput): boolean {
  const provider = normalized(input.providerAddress);
  return localityTokens(input.address, input.market)
    .some((token) => provider.includes(normalized(token)));
}

function distanceMetres(left: PhotoLocation, right: PhotoLocation): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDistance = radians(right.latitude - left.latitude);
  const longitudeDistance = radians(right.longitude - left.longitude);
  const firstLatitude = radians(left.latitude);
  const secondLatitude = radians(right.latitude);
  const haversine = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDistance / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function decision(
  disposition: PhotoIdentityDecision['disposition'],
  confidence: number,
  evidence: readonly string[],
): PhotoIdentityDecision {
  return Object.freeze({
    disposition,
    confidence,
    policyVersion: POLICY_VERSION,
    evidence: Object.freeze([...evidence]),
  });
}

export function scorePhotoIdentity(input: PhotoIdentityInput): PhotoIdentityDecision {
  if (!input.hasPhoto) return decision('reject', 0, ['missing-photo']);
  const country = countryEvidence(input.market, input.providerAddress);
  if (country.conflicts) return decision('reject', 0, ['country-conflict']);
  if (!nameMatches(input) || explicitNumberConflict(input)) return decision('reject', 0, ['name-conflict']);
  if (postalConflicts(input)) return decision('reject', 0, ['postal-code-conflict']);
  const locality = localityMatches(input);
  if (locality && addressNumberConflict(input)) return decision('reject', 0, ['address-number-conflict']);

  const evidence = ['name'];
  if (country.matches) evidence.push('country');
  const postal = postalMatches(input);
  if (postal) evidence.push('postal-code');

  if (country.matches && postal) return decision('auto-approve', 1, evidence);
  const exactName = exactNameMatches(input);
  if (exactName && input.entityLocation !== null && input.providerLocation !== null) {
    if (distanceMetres(input.entityLocation, input.providerLocation) <= 250) {
      return decision('auto-approve', 0.98, [...evidence, 'distance<=250m']);
    }
    return decision('reject', 0, ['distance-conflict']);
  }
  if (country.matches && exactName && exactAddressMatches(input)) {
    return decision('auto-approve', 0.97, [...evidence, 'address']);
  }
  if (locality) evidence.push('locality');
  if (country.matches && locality && input.entityLocation !== null && input.providerLocation !== null) {
    if (distanceMetres(input.entityLocation, input.providerLocation) <= 250) {
      return decision('auto-approve', 0.95, [...evidence, 'distance<=250m']);
    }
    return decision('reject', 0, ['distance-conflict']);
  }
  if (country.matches && locality) return decision('review', 0.75, evidence);
  if (country.matches) return decision('review', 0.6, evidence);
  return decision('review', 0.5, evidence);
}
