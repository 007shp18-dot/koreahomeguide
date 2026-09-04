import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { selectWikimediaPhotoCandidate } from '../lib/photos/building-photo-store.server';

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
});
