export const SINGAPORE_MARKET_SEGMENTS = Object.freeze(['CCR', 'RCR', 'OCR'] as const);
export const SINGAPORE_SALE_TYPES = Object.freeze(['new_sale', 'sub_sale', 'resale'] as const);
export const SINGAPORE_PROPERTY_TYPES = Object.freeze([
  'apartment',
  'condominium',
  'executive_condominium',
  'detached',
  'semi_detached',
  'terrace',
  'strata_detached',
  'strata_semi_detached',
  'strata_terrace',
] as const);
export const SINGAPORE_AREA_BASES = Object.freeze(['strata', 'land'] as const);

export type SingaporeMarketSegment = (typeof SINGAPORE_MARKET_SEGMENTS)[number];
export type SingaporeSaleType = (typeof SINGAPORE_SALE_TYPES)[number];
export type SingaporePropertyType = (typeof SINGAPORE_PROPERTY_TYPES)[number];
export type SingaporeAreaBasis = (typeof SINGAPORE_AREA_BASES)[number];
