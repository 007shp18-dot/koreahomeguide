import { describe, expect, it } from 'vitest';

import { readUraCredential, redactUraDiagnostic } from '../src/credential';

describe('URA credential boundary', () => {
  it('reads and freezes only the configured server credential', () => {
    const credential = readUraCredential({ SIGNEDPRICE_URA_ACCESS_KEY: 'test-only-key' });
    expect(credential).toEqual({ accessKey: 'test-only-key' });
    expect(Object.isFrozen(credential)).toBe(true);
  });

  it.each([{}, { SIGNEDPRICE_URA_ACCESS_KEY: '' }, { SIGNEDPRICE_URA_ACCESS_KEY: '   ' }])(
    'rejects missing or blank configuration without reflecting input %#',
    (environment) => {
      expect(() => readUraCredential(environment)).toThrow('URA access is not configured.');
      try { readUraCredential(environment); } catch (error) {
        expect(String(error)).toBe('Error: URA access is not configured.');
      }
    },
  );

  it('redacts every provider diagnostic to one public message', () => {
    expect(redactUraDiagnostic('Authorization test-only-key token'))
      .toBe('URA provider request failed.');
    expect(redactUraDiagnostic(new Error('AccessKey test-only-key')))
      .toBe('URA provider request failed.');
  });
});
