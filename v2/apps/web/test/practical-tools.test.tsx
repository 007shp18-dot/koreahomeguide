import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PracticalTool } from '../components/newsroom/practical-tool';
import { calculatePractical, PRACTICAL_DEFAULTS } from '../lib/practical-tools';

describe('Practical article tools', () => {
  it('keeps the Korean deposit out of monthly expenditure', () => {
    expect(calculatePractical('korea', PRACTICAL_DEFAULTS.korea)).toEqual([900000, 10000000]);
    expect(calculatePractical('korea', ['20000000', '800000', '100000', '60000'])).toEqual([960000, 20000000]);
  });
  it('distinguishes cheaper PSF from a higher purchase price', () => {
    const result = calculatePractical('singapore', PRACTICAL_DEFAULTS.singapore)!;
    expect(result[0]).toBe(2000);
    expect(result[1]).toBeCloseTo(1818.1818, 4);
    expect(result[2]).toBe(200000);
    expect(calculatePractical('singapore', ['2000000', '1100', '1800000', '900'])?.[2]).toBe(-200000);
  });
  it('applies management to collected rent and acquisition costs only to the denominator', () => {
    const result = calculatePractical('dubai', PRACTICAL_DEFAULTS.dubai)!;
    expect(result[0]).toBeCloseTo(64166.6667, 4);
    expect(result[1]).toBeCloseTo(3208.3333, 4);
    expect(result[2]).toBeCloseTo(45958.3333, 4);
    expect(result[3]).toBeCloseTo(4.595833, 5);
    expect(result[4]).toBeCloseTo(4.315336, 5);
    const allVacant = calculatePractical('dubai', ['1000000', '70000', '12', '12000', '5', '3000', '65000'])!;
    expect(allVacant.slice(0, 3)).toEqual([0, 0, -15000]);
    expect(allVacant[3]).toBe(-1.5);
  });
  it('does not silently turn unknown costs or invalid ratios into results', () => {
    for (const value of ['', ' ', '-1', 'Infinity', 'NaN', '1000000000001']) {
      expect(calculatePractical('korea', ['1', '2', '3', value])).toBeNull();
    }
    expect(calculatePractical('singapore', ['100', '0', '200', '20'])).toBeNull();
    expect(calculatePractical('dubai', ['0', '70000', '1', '12000', '5', '3000', '0'])).toBeNull();
    expect(calculatePractical('dubai', ['1', '2', '13', '0', '5', '0', '0'])).toBeNull();
    expect(calculatePractical('dubai', ['1', '2', '1', '0', '101', '0', '0'])).toBeNull();
  });
  it.each(['en', 'ko'] as const)('renders all four tools with labelled controls in %s', locale => {
    for (const kind of ['korea', 'japan', 'singapore', 'dubai'] as const) {
      const html = renderToStaticMarkup(<PracticalTool kind={kind} locale={locale} />);
      expect(html).toContain('id="practical-tool"');
      expect(html).toContain('aria-labelledby=');
      expect(html).not.toContain('NaN');
      if (kind === 'japan') expect(html.match(/type="checkbox"/g)).toHaveLength(3);
      else expect(html.match(/type="number"/g)).toHaveLength(PRACTICAL_DEFAULTS[kind].length);
    }
  });
});
