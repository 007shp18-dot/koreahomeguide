/** Versioned, reviewed regional imagery. No database or per-view provider calls. */
export const SINGAPORE_REGION_PHOTOS = {
  CCR: { src: '/assets/markets/singapore-marina-bay-context.webp', alt: 'The Sail at Marina Bay, Singapore', location: 'Marina Bay', author: 'William Cho', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', source: 'https://commons.wikimedia.org/wiki/File:The_Sail_@_Marina_Bay,_Singapore.jpg' },
  RCR: { src: '/assets/markets/singapore-queenstown-context.webp', alt: 'HDB flats along Strathmore Avenue in Queenstown, Singapore', location: 'Queenstown', author: 'Calvin Teo', license: 'CC BY-SA 2.5', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.5/', source: 'https://commons.wikimedia.org/wiki/File:Queenstown_hdb.jpg' },
  OCR: { src: '/assets/markets/singapore-tampines-context.webp', alt: 'HDB residential buildings in Tampines, Singapore', location: 'Tampines', author: 'Terence Ong', license: 'CC BY 2.5', licenseUrl: 'https://creativecommons.org/licenses/by/2.5/', source: 'https://commons.wikimedia.org/wiki/File:Tampines_HDB_4.JPG' },
} as const;
export const SINGAPORE_REGION_PHOTO_REVIEW = { reviewedOn: '2026-09-08', status: 'approved', scope: 'regional-context', modifications: '480px WebP at quality 80, responsive display crop. Originals and licenses are linked at source.' } as const;
