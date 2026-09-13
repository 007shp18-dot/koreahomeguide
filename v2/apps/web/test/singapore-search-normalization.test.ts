import { expect, it } from 'vitest';
import { singaporeProjectSearchTerm as term } from '../lib/singapore/project-display-name';
it('matches spacing, punctuation, accents and full-width input consistently', () => {
  expect(term('MARINA ONE RESIDENCES')).toContain(term('MarinaOne'));
  expect(term('ENCHANTÉ')).toBe(term('enchante'));
  expect(term('THE INTERLACE')).toBe(term('ＴＨＥ-ＩＮＴＥＲＬＡＣＥ'));
});
