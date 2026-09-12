import { afterEach, expect, it, vi } from 'vitest';
import { createSelectionHref } from '../lib/navigation/explorer-selection';
import {
  normalizeExploreHref, parseJournal, withRecentPlace, withPlaceNote,
  readJournal, writeJournal, subscribeJournal, JOURNAL_KEY,
  type RecentPlace,
} from '../lib/discovery/journal';

afterEach(() => vi.unstubAllGlobals());
const visit = (key = 'marsa-dubai'): RecentPlace => ({
  market: 'dubai', key, name: key, href: `/ae/dubai/explore/${key}/?housing=apartment&stage=ready`,
  viewedAt: '2026-09-12T12:00:00.000Z',
});

it('keeps twelve actual places, updating rather than duplicating a revisited place', () => {
  let state = parseJournal('');
  for (let i = 0; i < 16; i++) state = withRecentPlace(state, visit(`area-${i}`));
  expect(state.recent).toHaveLength(12);
  const revised = { ...visit('area-5'), href: '/ae/dubai/explore/area-5/?housing=villa&stage=ready' };
  state = withRecentPlace(state, revised);
  expect(state.recent[0]).toEqual(revised);
  expect(state.recent.filter(p => p.key === 'area-5')).toHaveLength(1);
  expect(state.recent.some(p => p.key === 'area-0')).toBe(false);
});

it('accepts only same-city internal Explore routes and preserves public filters without private context', () => {
  expect(normalizeExploreHref('dubai', '/ko/ae/dubai/explore/?area=marsa-dubai&housing=villa&stage=ready&passport=private&token=secret#compare=secret'))
    .toBe('/ae/dubai/explore/?area=marsa-dubai&housing=villa&stage=ready');
  for (const href of ['https://evil.test/ae/dubai/explore/', '//evil.test/ae/dubai/explore/', '/ae/dubai/explore/../../admin/', '/sg/singapore/explore/', '/api/shortlist/dubai', '/ae/dubai/explore/\\evil', 'javascript:alert(1)']) {
    expect(normalizeExploreHref('dubai', href)).toBeNull();
  }
  expect(normalizeExploreHref('tokyo', '/zh-cn/jp/tokyo/explore/?city=13103&neighbourhood=%E8%B5%A4%E5%9D%82&year=2025&quarter=4'))
    .toContain('neighbourhood=%E8%B5%A4%E5%9D%82');
});

it('rejects corrupt, oversized, cross-city and duplicate stored records', () => {
  for (const raw of ['', '{', 'null', '[]', 'x'.repeat(250_001)]) expect(parseJournal(raw)).toEqual({ version: 1, recent: [], notes: [] });
  const state = parseJournal(JSON.stringify({ version: 1, recent: [visit(), visit(), { ...visit('bad'), href: '/api/private' }, { ...visit('date'), viewedAt: 'bad' }], notes: [
    { market: 'dubai', key: 'marsa-dubai/apartment-ready', text: 'Walk to the tram' },
    { market: 'dubai', key: 'marsa-dubai/apartment-ready', text: 'Duplicate' },
    { market: 'dubai', key: 'oversized', text: 'x'.repeat(1001) },
  ] }));
  expect(state.recent).toEqual([visit()]);
  expect(state.notes).toEqual([{ market: 'dubai', key: 'marsa-dubai/apartment-ready', text: 'Walk to the tram' }]);
});

it('retains the actual Seoul serializer building selection and rental contract cohort', () => {
  const href = createSelectionHref('/kr/seoul/explore/', {
    market: 'kr', transaction: 'jeonse', district: 'gangnam-gu', neighborhood: 'daechi-dong',
    buildingId: 'building-123', contractType: 'renewal', area: '60-85', propertyType: 'apartment',
  }, { market: 'kr', transaction: 'sale' });
  expect(normalizeExploreHref('seoul', href)).toBe(href);
  const query = new URL(normalizeExploreHref('seoul', href)!, 'https://signedprice.invalid').searchParams;
  expect(query.get('buildingId')).toBe('building-123');
  expect(query.get('contractType')).toBe('renewal');
});

it('preserves notes through visits and history clearing, and deletes only the selected note', () => {
  let state = withPlaceNote(parseJournal(''), { market: 'dubai', key: 'a', text: 'Check annual charges\nVisit at rush hour' })!;
  state = withPlaceNote(state, { market: 'seoul', key: 'a', text: '소음 확인' })!;
  state = withRecentPlace(state, visit());
  state = parseJournal(JSON.stringify({ ...state, recent: [] }));
  expect(state.notes).toHaveLength(2);
  expect(withPlaceNote(state, { market: 'dubai', key: 'a', text: '' })?.notes).toEqual([{ market: 'seoul', key: 'a', text: '소음 확인' }]);
  expect(withPlaceNote(state, { market: 'dubai', key: 'a', text: 'x'.repeat(1001) })).toBeNull();
});

it('caps notes without preventing an existing note from being edited', () => {
  let state = parseJournal('');
  for (let i = 0; i < 120; i++) state = withPlaceNote(state, { market: 'seoul', key: `key-${i}`, text: 'note' })!;
  expect(withPlaceNote(state, { market: 'dubai', key: 'extra', text: 'note' })).toBeNull();
  expect(withPlaceNote(state, { market: 'seoul', key: 'key-0', text: 'updated' })?.notes.find(n => n.key === 'key-0')?.text).toBe('updated');
});

it('notifies same-tab subscribers, respects cleared storage and reports blocked persistence', () => {
  const target = new EventTarget();
  let raw: string | null = null;
  const storage = { getItem: () => raw, setItem: (_: string, value: string) => { raw = value; } };
  vi.stubGlobal('window', { localStorage: storage, dispatchEvent: target.dispatchEvent.bind(target), addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target) });
  let notifications = 0;
  const unsubscribe = subscribeJournal(() => notifications++);
  const state = withRecentPlace(parseJournal(''), visit());
  expect(writeJournal(state)).toBe(true);
  expect(parseJournal(readJournal())).toEqual(state);
  expect(notifications).toBe(1);
  raw = null;
  expect(parseJournal(readJournal()).recent).toEqual([]);
  storage.setItem = () => { throw new Error('blocked'); };
  expect(writeJournal(state)).toBe(false);
  expect(parseJournal(readJournal())).toEqual(state);
  target.dispatchEvent(Object.assign(new Event('storage'), { key: JOURNAL_KEY }));
  expect(parseJournal(readJournal()).recent).toEqual([]);
  unsubscribe();
});
