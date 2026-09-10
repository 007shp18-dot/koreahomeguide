import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { CollectionPanel } from '../components/evidence-admin/collection-panel';
import type { CollectionStatus } from '../lib/data-operations/repository.server';
const source: CollectionStatus = {sourceId:'test',name:'Official fees',market:'singapore',category:'fees',url:'https://example.com/fees',mode:'page-monitor',intervalDays:7,limitation:'Review conditions',lastSuccessAt:'2026-09-09T00:00:00Z',lastAttemptAt:'2026-09-10T00:00:00Z',nextDueAt:'2026-09-10T02:00:00Z',lastPublishedAt:null,consecutiveFailures:2,lastError:'http_503',anomaly:'content_size_drop_over_50_percent',newCount:1,changedCount:0,pendingCount:3,latestSnapshotId:null,probe:null,pendingCandidateCount:0,recordCount:0};
it('distinguishes successful collection from publication and exposes failures and pending review', () => {
 const html=renderToStaticMarkup(<CollectionPanel initialData={{sources:[source],publication:'review required'}}/>);
 expect(html).toContain('공개 연결 기록 없음');expect(html).toContain('성공 2026-09-09 00:00:00 UTC');
 expect(html).toContain('연속 실패 2회');expect(html).toContain('http_503');expect(html).toContain('content_size_drop_over_50_percent');
 expect(html).toContain('검토 대기 3');expect(html).toContain('지금 변경 확인');expect(html).toContain('사이트 공개는 별개');
});
it('never offers page collection for a blocked/manual source', () => {
 const html=renderToStaticMarkup(<CollectionPanel initialData={{sources:[{...source,mode:'blocked'}],publication:'review required'}}/>);
 expect(html).not.toContain('지금 변경 확인');expect(html).toContain('수집 이력');
});
it('shows OneMap candidate and publication counts without treating candidates as public', () => {
 const onemap={...source,sourceId:'sg-onemap-building',name:'OneMap building addresses',mode:'address-api',pendingCount:0,pendingCandidateCount:14,recordCount:100,lastPublishedAt:'2026-09-10T02:00:00Z'};
 const html=renderToStaticMarkup(<CollectionPanel initialData={{sources:[onemap],publication:'review required'}}/>);
 expect(html).toContain('위치 후보 100건 · 위치 검토 대기 14건');
 expect(html).toContain('공식 주소 API');expect(html).not.toContain('수집 이력');
 expect(html).toContain('마지막 공개');expect(html).toContain('2026-09-10 02:00:00 UTC');
});
