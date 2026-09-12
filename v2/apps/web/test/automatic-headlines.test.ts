import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({ publicContentDatabase: () => null }));
import { automaticHeadline } from '../lib/news/automatic-headlines.server';
const now = Date.parse('2026-09-10T12:00:00Z');
const row = { id: 1, market_id: 'jp-tokyo', is_active: true, review_state: 'new', source_kind: 'google-news-rss', title: 'Tokyo condominium prices rise in August', publisher: 'Example publisher', canonical_url: 'https://news.google.com/rss/articles/abc', source_published_at: '2026-09-09T12:00:00Z', summary: 'Do not republish this description' };
describe('automatic external headline boundary', () => {
  it.each([
    ['jp-tokyo', '東京の家賃が上昇、賃貸市場の最新動向', 'tokyo'],
    ['ae-dubai', 'ارتفاع إيجارات الشقق السكنية في دبي', 'dubai'],
  ])('accepts local housing headlines for %s', (market_id, title, market) => {
    expect(automaticHeadline({ ...row, market_id, title }, now)).toMatchObject({ market, title });
  });
  it.each([
    ['jp-tokyo', '東京で野球大会が開催されます'],
    ['ae-dubai', 'دبي تستضيف بطولة كرة القدم'],
    ['ae-dubai', 'ارتفاع إيجارات الشقق السكنية في أبوظبي'],
  ])('still excludes unrelated local headlines: %s %s', (market_id, title) => {
    expect(automaticHeadline({ ...row, market_id, title }, now)).toBeNull();
  });
  it('publishes metadata only without claiming editorial or transaction verification', () => {
    expect(automaticHeadline(row, now)).toMatchObject({ market: 'tokyo', summary: '', evidence: 'checking', category: 'External headline', internalHref: null });
    expect(automaticHeadline(row, now)?.evidenceLine).toContain('not been verified');
  });
  it.each([{ review_state: 'rejected' }, { is_active: false }, { review_state: 'linked' }, { source_published_at: '2026-09-11' }, { source_published_at: '2025-01-01' }, { canonical_url: 'javascript:alert(1)' }, { canonical_url: 'https://evil.example/story' }, { title: 'Tokyo baseball championship returns this weekend' }, { title: 'London condominium prices rise in August' }])('withholds invalid or excluded metadata %j', change => {
    expect(automaticHeadline({ ...row, ...change }, now)).toBeNull();
  });
});
