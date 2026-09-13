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

it('preserves named property identity through all language switches', () => {
  for (const path of ['/jp/tokyo/explore/properties/jp-park-city-toyosu/', '/ae/dubai/explore/projects/ae-valia/']) {
    const result=languageDestinations('/ko'+path);
    expect(result).toEqual({en:path,ko:'/ko'+path,'zh-CN':'/zh-cn'+path});
  }
});
