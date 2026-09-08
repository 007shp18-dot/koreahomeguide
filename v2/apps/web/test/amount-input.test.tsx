import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AmountInput } from '../components/amount-input';
import { formatAmountInput, rawAmountInput, amountCaretPosition, submittedAmountInput, amountStepValid } from '../lib/format/amount-input';

describe('editable amounts', () => {
  it.each([
    ['1234567', '1,234,567', '1234567'],
    ['1,234,567.50', '1,234,567.50', '1234567.50'],
    ['1000.', '1,000.', '1000.'],
    ['', '', ''],
    ['0', '0', '0'],
    ['.5', '0.5', '0.5'],
    ['１２３４５', '12,345', '12345'],
  ])('formats %s without changing its numeric value', (value, display, raw) => {
    expect(formatAmountInput(value)).toBe(display);
    expect(rawAmountInput(value)).toBe(raw);
  });
  it('rejects invalid pasted signs and multiple decimal separators instead of silently changing the price', () => {
    expect(rawAmountInput('-100')).toBeNull();
    expect(rawAmountInput('1.2.3')).toBeNull();
    expect(rawAmountInput('1e6')).toBeNull();
  });
  it('keeps the caret after the same digit when a comma is inserted', () => {
    expect(amountCaretPosition('1,234,567', 4)).toBe(5);
    expect(amountCaretPosition('1,000.', 5)).toBe(6);
  });
  it('submits a finished decimal without changing the editable trailing dot', () => {
    expect(submittedAmountInput('1,000.')).toBe('1000');
    expect(submittedAmountInput('0.50')).toBe('0.50');
    expect(submittedAmountInput('')).toBe('');
  });
  it('retains numeric input step validation including decimal steps', () => {
    expect(amountStepValid('1.5', 1)).toBe(false);
    expect(amountStepValid('1.5', 0.1)).toBe(true);
    expect(amountStepValid('1.2', 0.1, 0.1)).toBe(true);
    expect(amountStepValid('', 1)).toBe(true);
    expect(amountStepValid('12.123', 'any')).toBe(true);
  });
  it('renders grouped editable text and a separate raw submission value', () => {
    const html = renderToStaticMarkup(createElement(AmountInput, { name: 'price', value: '1000.', required: true, onValueChange: () => {} }));
    expect(html).toContain('type="hidden" name="price" value="1000"');
    expect(html).toContain('data-amount-name="price"');
    expect(html).toContain('value="1,000."');
    expect(html).toContain('required=""');
  });
});
