import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  SINGAPORE_MARKET_SEGMENTS,
  SINGAPORE_PROPERTY_TYPES,
  SINGAPORE_SALE_TYPES,
} from '../src/browser';
import { SG_URA_PRIVATE_SALE_RIGHTS } from '../src/rights';

describe('URA private sale rights boundary', () => {
  it('keeps display gated pending dataset-specific confirmation', () => {
    expect(SG_URA_PRIVATE_SALE_RIGHTS.operations).toEqual({
      ingest: 'requires_dataset_confirmation',
      aggregate: 'requires_dataset_confirmation',
      display: 'requires_dataset_confirmation',
      commercial: 'requires_dataset_confirmation',
      index: 'blocked',
    });
    expect(SG_URA_PRIVATE_SALE_RIGHTS.reviewedAt).toBe('2026-08-31');
    expect(SG_URA_PRIVATE_SALE_RIGHTS.sources.every((source) => source.url.startsWith('https://')))
      .toBe(true);
    expect(Object.isFrozen(SG_URA_PRIVATE_SALE_RIGHTS)).toBe(true);
  });

  it('exports exhaustive browser-safe native enums', () => {
    expect(SINGAPORE_MARKET_SEGMENTS).toEqual(['CCR', 'RCR', 'OCR']);
    expect(SINGAPORE_SALE_TYPES).toEqual(['new_sale', 'sub_sale', 'resale']);
    expect(SINGAPORE_PROPERTY_TYPES).toContain('executive_condominium');
    const browserSource = readFileSync(new URL('../src/browser.ts', import.meta.url), 'utf8');
    expect(browserSource).not.toMatch(/credential|accessKey|SIGNEDPRICE_URA|insertNewToken|invokeUraDS|AccessKey/i);
  });
});
