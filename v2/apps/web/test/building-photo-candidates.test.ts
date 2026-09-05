import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  googlePlaceAddressMatches,
  selectWikimediaPhotoCandidate,
} from '../lib/photos/building-photo-store.server';

describe('Wikimedia building photo candidates', () => {
  it('retains an exact-name image only when reusable license metadata is attached', () => {
    expect(selectWikimediaPhotoCandidate('10 Evelyn', [{
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
    }])).toEqual({
      assetUrl: 'https://upload.wikimedia.org/example/1600px.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:10_Evelyn_Singapore_exterior.jpg',
      attributionName: 'Example photographer',
      licenseName: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    });
  });

  it('rejects nearby subjects, non-images, and files without license evidence', () => {
    expect(selectWikimediaPhotoCandidate('10 Evelyn', [{
      title: 'File:Evelyn Road streetscape.jpg',
      imageinfo: [{ mime: 'image/jpeg' }],
    }])).toBeNull();
    expect(selectWikimediaPhotoCandidate('10 Evelyn', [{
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
    expect(selectWikimediaPhotoCandidate('Sky Habitat', [{
      title: 'File:Sky Habitat old.jpg',
      imageinfo: [{...common,width:900,height:600,thumburl:'https://upload.wikimedia.org/example/old.jpg'}],
    }, {
      title: 'File:Sky Habitat at dawn.jpg',
      imageinfo: [{...common,width:2970,height:2414,thumburl:'https://upload.wikimedia.org/example/dawn.jpg'}],
    }])?.assetUrl).toBe('https://upload.wikimedia.org/example/dawn.jpg');
  });
});

describe('Google building address identity', () => {
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
