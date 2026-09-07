import { describe, expect, it } from 'vitest';
import { singaporeProjectDisplayName } from '../lib/singapore/project-display-name';

describe('verified Singapore display names', () => {
  it('repairs the two damaged names only at their verified street', () => {
    expect(singaporeProjectDisplayName({ project: 'ENCHANT\uFFFD', street: 'EVELYN ROAD' })).toBe('ENCHANTÉ');
    expect(singaporeProjectDisplayName({ project: 'VERD\uFFFD JOO CHIAT', street: 'JOO CHIAT TERRACE' })).toBe('VERDÉ JOO CHIAT');
  });
  it('does not guess unknown characters, alter source objects or change valid names', () => {
    const source = Object.freeze({ project: 'ENCHANT\uFFFD', street: 'OTHER ROAD', id: 'unchanged' });
    expect(singaporeProjectDisplayName(source)).toBe(source.project);
    expect(source.id).toBe('unchanged');
    expect(singaporeProjectDisplayName({ project: 'OTHER\uFFFD', street: 'EVELYN ROAD' })).toBe('OTHER\uFFFD');
    expect(singaporeProjectDisplayName({ project: 'ENCHANTÉ', street: 'EVELYN ROAD' })).toBe('ENCHANTÉ');
  });
});
