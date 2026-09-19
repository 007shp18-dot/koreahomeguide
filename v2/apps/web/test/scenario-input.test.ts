import { expect, it } from 'vitest';
import { evaluateScenarioDraft } from '../lib/tools/property-scenario-input';

const draft = { price: '1000000', acquisitionCosts: '50000', monthlyRent: '', annualCosts: '', vacancyMonths: '0' };
it('calculates purchase outlay without treating unentered rent and costs as zero', () => {
  expect(evaluateScenarioDraft(draft)).toMatchObject({ totalCost: 1_050_000, scenario: null, missing: ['monthlyRent', 'annualCosts'], errors: {} });
});
it('explains invalid vacancy without hiding an independently valid purchase outlay', () => {
  expect(evaluateScenarioDraft({ ...draft, monthlyRent: '7000', annualCosts: '12000', vacancyMonths: '13' })).toMatchObject({ totalCost: 1_050_000, scenario: null, errors: { vacancyMonths: 'vacancy' } });
});
it('requires positive finite prices and never treats a blank acquisition subtotal as zero', () => {
  expect(evaluateScenarioDraft({ ...draft, price: '0' })).toMatchObject({ totalCost: null, errors: { price: 'positive' } });
  expect(evaluateScenarioDraft({ ...draft, price: 'Infinity' }).totalCost).toBeNull();
  expect(evaluateScenarioDraft({ ...draft, acquisitionCosts: '' }).totalCost).toBeNull();
});
it('accepts explicitly entered zero assumptions and updates the operating result', () => {
  expect(evaluateScenarioDraft({ ...draft, monthlyRent: '7000', annualCosts: '12000', vacancyMonths: '1' }).scenario).toMatchObject({ totalCost: 1_050_000, netIncome: 65_000 });
  expect(evaluateScenarioDraft({ ...draft, monthlyRent: '0', annualCosts: '0' }).scenario).toMatchObject({ netIncome: 0, netYield: 0 });
});
