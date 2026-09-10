import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  decideGooglePhotoCandidate,
  googlePlaceAddressMatches,
  selectWikimediaPhotoCandidate,
} from '../lib/photos/building-photo-store.server';

describe('Wikimedia building photo candidates', () => {
  it('retains an exact-name image only when reusable license metadata is attached', () => {
    expect(selectWikimediaPhotoCandidate({
      name: '10 Evelyn', marketKey: 'singapore', address: '10 Evelyn Road, Singapore',
    }, [{
      title: 'File:10 Evelyn Singapore exterior.jpg',
      imageinfo: [{
        mime: 'image/jpeg',
        url: 'https://upload.wikimedia.org/example/original.jpg',
        thumburl: 'https://upload.wikimedia.org/example/1600px.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:10_Evelyn_Singapore_exterior.jpg',
        extmetadata: {
          Artist: { value: '<a href="/wiki/User:Example">Example photographer</a>' },
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
        },
      }],
    }])).toMatchObject({
      assetUrl: 'https://upload.wikimedia.org/example/1600px.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:10_Evelyn_Singapore_exterior.jpg',
      attributionName: 'Example photographer',
      licenseName: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      disposition: 'review',
      policyVersion: 'photo-identity-v2',
    });
  });

  it('rejects numeric-only building identities before searching ambiguous filenames', () => {
    expect(selectWikimediaPhotoCandidate({
      name: '(568-12)', marketKey: 'seoul', address: '서울특별시 강남구 역삼동 568-12',
    }, [{
      title: 'File:568-12.jpg',
      imageinfo: [{
        mime: 'image/jpeg', width: 2000, height: 1400,
        url: 'https://upload.wikimedia.org/example/568-12.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:568-12.jpg',
        extmetadata: {
          Artist: { value: 'Example photographer' },
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
        },
      }],
    }])).toBeNull();
  });

  it('rejects an exact filename without evidence for the requested country', () => {
    expect(selectWikimediaPhotoCandidate({
      name: 'Sunshine Plaza', marketKey: 'singapore', address: '91 Bencoolen Street, Singapore',
    }, [{
      title: 'File:Sunshine Plaza.jpg',
      imageinfo: [{
        mime: 'image/jpeg', width: 2000, height: 1400,
        url: 'https://upload.wikimedia.org/example/sunshine-plaza.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Sunshine_Plaza.jpg',
        extmetadata: {
          Artist: { value: 'Example photographer' },
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
        },
      }],
    }])).toBeNull();
  });

  it('auto-approves an exact Commons identity with country, address, and nearby coordinates', () => {
    expect(selectWikimediaPhotoCandidate({
      name: 'Sky Habitat',
      marketKey: 'singapore',
      address: '7 Bishan Street 15, Singapore',
      postalCode: null,
      latitude: 1.3512,
      longitude: 103.8503,
    }, [{
      title: 'File:Sky Habitat Singapore.jpg',
      coordinates: [{ lat: 1.3513, lon: 103.8504 }],
      imageinfo: [{
        mime: 'image/jpeg', width: 2600, height: 1600,
        thumburl: 'https://upload.wikimedia.org/example/sky-habitat.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Sky_Habitat_Singapore.jpg',
        extmetadata: {
          Artist: { value: 'Example photographer' },
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
          ObjectName: { value: 'Sky Habitat' },
          ImageDescription: { value: 'Sky Habitat, 7 Bishan Street 15, Singapore' },
        },
      }],
    }])).toMatchObject({
      disposition: 'auto-approve',
      confidence: 0.98,
      policyVersion: 'photo-identity-v2',
      evidence: ['name', 'country', 'distance<=250m'],
    });
  });

  it('accepts exact geotagged Commons evidence when the description omits the country', () => {
    expect(selectWikimediaPhotoCandidate({
      name: 'Sky Habitat',
      marketKey: 'singapore',
      address: '7 Bishan Street 15, Singapore',
      latitude: 1.3512,
      longitude: 103.8503,
    }, [{
      title: 'File:Sky Habitat towers.jpg',
      coordinates: [{ lat: 1.3513, lon: 103.8504 }],
      imageinfo: [{
        mime: 'image/jpeg', width: 2600, height: 1600,
        thumburl: 'https://upload.wikimedia.org/example/sky-habitat-towers.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Sky_Habitat_towers.jpg',
        extmetadata: {
          Artist: { value: 'Example photographer' },
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
          ObjectName: { value: 'Sky Habitat' },
        },
      }],
    }])).toMatchObject({
      disposition: 'auto-approve',
      confidence: 0.98,
      evidence: ['name', 'distance<=250m'],
    });
  });

  it('rejects nearby subjects, non-images, and files without license evidence', () => {
    expect(selectWikimediaPhotoCandidate({
      name: '10 Evelyn', marketKey: 'singapore', address: '10 Evelyn Road, Singapore',
    }, [{
      title: 'File:Evelyn Road streetscape.jpg',
      imageinfo: [{ mime: 'image/jpeg' }],
    }])).toBeNull();
    expect(selectWikimediaPhotoCandidate({
      name: '10 Evelyn', marketKey: 'singapore', address: '10 Evelyn Road, Singapore',
    }, [{
      title: 'File:10 Evelyn Singapore exterior.jpg',
      imageinfo: [{
        mime: 'image/jpeg',
        url: 'https://upload.wikimedia.org/example/original.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:10_Evelyn.jpg',
        extmetadata: {},
      }],
    }])).toBeNull();
  });

  it('prefers a high-resolution landscape result over a smaller exact-name image', () => {
    const common = {
      mime: 'image/jpeg',
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:Sky_Habitat.jpg',
      extmetadata: {
        Artist: { value: 'Example photographer' },
        LicenseShortName: { value: 'CC BY-SA 4.0' },
        LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
      },
    };
    expect(selectWikimediaPhotoCandidate({
      name: 'Sky Habitat', marketKey: 'singapore', address: 'Bishan Street 15, Singapore',
    }, [{
      title: 'File:Sky Habitat old.jpg',
      imageinfo: [{...common,width:900,height:600,thumburl:'https://upload.wikimedia.org/example/old.jpg',extmetadata:{...common.extmetadata,ImageDescription:{value:'Sky Habitat in Singapore'}}}],
    }, {
      title: 'File:Sky Habitat at dawn.jpg',
      imageinfo: [{...common,width:2970,height:2414,thumburl:'https://upload.wikimedia.org/example/dawn.jpg',extmetadata:{...common.extmetadata,ImageDescription:{value:'Sky Habitat in Singapore'}}}],
    }])?.assetUrl).toBe('https://upload.wikimedia.org/example/dawn.jpg');
  });

  it('rejects an exact-name file when its market evidence conflicts', () => {
    expect(selectWikimediaPhotoCandidate({
      name: 'The Interlace', marketKey: 'singapore', address: 'Depot Road, Singapore',
    }, [{
      title: 'File:The Interlace apartment building.jpg',
      imageinfo: [{
        mime: 'image/jpeg',
        width: 2000,
        height: 1400,
        url: 'https://upload.wikimedia.org/example/interlace.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:The_Interlace_apartment_building.jpg',
        extmetadata: {
          Artist: { value: 'Example photographer' },
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
          ImageDescription: { value: 'The Interlace apartment building in London, United Kingdom' },
        },
      }],
    }])).toBeNull();
  });
});

describe('Google building address identity', () => {
  it('uses the shared policy for an exact provider place', () => {
    expect(decideGooglePhotoCandidate({
      marketKey: 'singapore',
      name: 'RIVERGATE',
      address: '99 ROBERTSON QUAY SINGAPORE 238258',
      postalCode: '238258',
      latitude: null,
      longitude: null,
    }, {
      displayName: 'RiverGate',
      formattedAddress: '99 Robertson Quay, Singapore 238258',
      location: { latitude: 1.2915, longitude: 103.8354 },
      hasPhoto: true,
    })).toMatchObject({
      disposition: 'auto-approve',
      confidence: 1,
      policyVersion: 'photo-identity-v2',
    });
  });

  it('matches Singapore address tokens without depending on source casing', () => {
    expect(googlePlaceAddressMatches(
      '10 Woodlands Street 13, Singapore 738973',
      '10 WOODLANDS STREET 13',
      'singapore',
    )).toBe(true);
  });

  it('requires the Seoul district or a meaningful Singapore locality token', () => {
    expect(googlePlaceAddressMatches(
      '서울특별시 강남구 언주로 123',
      '서울특별시 강남구 역삼동 123',
      'seoul',
    )).toBe(true);
    expect(googlePlaceAddressMatches(
      '1 Marina Boulevard, Singapore',
      '10 WOODLANDS STREET 13',
      'singapore',
    )).toBe(false);
  });
});
