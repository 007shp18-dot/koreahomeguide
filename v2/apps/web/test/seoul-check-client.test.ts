import {describe,expect,test} from 'vitest';
import {seoulCheckRequestHref} from '../components/contract-check/seoul-check-client';
describe('Seoul Check entry requests',()=>{
 test('opens the default form without a comparison request, including campaign links',()=>{
  expect(seoulCheckRequestHref('', 'ko')).toBeNull();
  expect(seoulCheckRequestHref('utm_source=newsletter', 'en')).toBeNull();
 });
 test('restores a shared comparison and building handoff in the selected language',()=>{
  const href=seoulCheckRequestHref('check=1&district=gangseo-gu&building=example&area=42&price=750000000&returnTo=%2Fko%2Fkr%2Fseoul%2Fexplore%2F&unknown=ignored','ko');
  const query=new URL(href!, 'https://signedprice.com').searchParams;
  expect(query.get('district')).toBe('gangseo-gu');
  expect(query.get('building')).toBe('example');
  expect(query.get('price')).toBe('750000000');
  expect(query.get('returnTo')).toBe('/ko/kr/seoul/explore/');
  expect(query.get('locale')).toBe('ko');
  expect(query.has('unknown')).toBe(false);
 });
});
