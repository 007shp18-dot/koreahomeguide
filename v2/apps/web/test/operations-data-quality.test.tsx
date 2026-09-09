import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, expect, it, vi} from 'vitest';
vi.mock('server-only', () => ({}));
import {marketCollectionStatus} from '../lib/data-operations/market-status.server';
import {dataQuality} from '../lib/data-operations/data-quality.server';
import {DataQualityPanel} from '../components/evidence-admin/data-quality-panel';

afterEach(() => vi.unstubAllEnvs());
it('retains the successful source timestamp after failure and includes independently scheduled Japan', async () => {
  vi.stubEnv('SIGNEDPRICE_MARKET_REFRESH_JOBS','kr-seoul-sale');
  vi.stubEnv('SIGNEDPRICE_JAPAN_REFRESH_ENABLED','true');
  const query = vi.fn().mockResolvedValue([{job:'kr-seoul-sale',state:'failed',source_as_of:null,
    last_success_source_as_of:'2026-09-08T00:00:00Z',last_success_at:'2026-09-08T01:00:00Z',error_code:'provider_unavailable'}]);
  const rows = await marketCollectionStatus({query});
  expect(rows.find(row => row.job==='kr-seoul-sale')).toMatchObject({state:'failed',sourceAsOf:'2026-09-08T00:00:00Z',errorCode:'provider_unavailable'});
  expect(rows.find(row => row.job==='jp-tokyo-sale')).toMatchObject({enabled:true,state:null});
});
it('does not disable the separate Japan schedule when the other job list is invalid', async () => {
  vi.stubEnv('SIGNEDPRICE_MARKET_REFRESH_JOBS','invalid');
  vi.stubEnv('SIGNEDPRICE_JAPAN_REFRESH_ENABLED','true');
  const rows = await marketCollectionStatus({query:vi.fn().mockResolvedValue([])});
  expect(rows.filter(row => row.enabled).map(row => row.job)).toEqual(['jp-tokyo-sale']);
});
it('keeps quarter precision and does not turn absent building evidence into a zero percent rate', async () => {
  const row = {market:'jp-tokyo',records:'178',period_start:'2025-Q3',period_end:'2026-Q1',entities:0,
    missing_address:0,missing_coordinates:0,unverified_identity:0,photo_unavailable:0,photo_unchecked:0,wards:13};
  const rows = await dataQuality({query:vi.fn().mockResolvedValue([row,{...row,market:'ae-dubai',records:0,period_start:null,period_end:null,wards:null}])});
  const html = renderToStaticMarkup(<DataQualityPanel rows={rows}/>);
  expect(html).toContain('2025-Q3 ~ 2026-Q1');
  expect(html).toContain('공개 지역 13 / 23개 구');
  expect(html).toContain('집계 대상 없음');
  expect(html).not.toContain('NaN');
  expect(html).not.toContain('0.0%');
  expect(html).toContain('사이트 공개 건수와 다를 수 있음');
  expect(html).toContain('별도 배포된 두바이 지역 통계');
});

it('does not compare counts across Tokyo ward and quarter collection scopes', async () => {
  const rows = await marketCollectionStatus({query:vi.fn().mockResolvedValue([
    {job:'jp-tokyo-sale',state:'succeeded',received:50,previous_received:500},
    {job:'kr-seoul-sale',state:'succeeded',received:50,previous_received:500},
  ])});
  expect(rows.find(row => row.job==='jp-tokyo-sale')?.anomaly).toBeNull();
  expect(rows.find(row => row.job==='kr-seoul-sale')?.anomaly).toContain('기간 변경');
});
