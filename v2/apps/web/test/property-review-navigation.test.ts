import { expect, it } from 'vitest';
import { languageDestinations, marketDestination } from '../lib/navigation/site-navigation';

it('retains a selected property and city when switching review languages', () => {
  const destinations = languageDestinations('/ko/living/', '?market=sg-singapore&profile=sg-marina-one-residences');
  expect(destinations.en).toBe('/living/?market=sg-singapore&profile=sg-marina-one-residences');
  expect(destinations.ko).toBe('/ko/living/?market=sg-singapore&profile=sg-marina-one-residences');
});
it('switches review cities without carrying a property from the previous city', () => {
  expect(marketDestination('jp-tokyo', '/ko/living/?profile=sg-marina-one-residences', 'ko')).toBe('/ko/living/?market=jp-tokyo');
});
