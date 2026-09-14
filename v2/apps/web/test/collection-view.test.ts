import {expect,it} from 'vitest';
import {sourceSignals,matchesSource,matchesMarket,mostRecent,marketJobLabel} from '../lib/data-operations/collection-view';
import type {CollectionStatus} from '../lib/data-operations/repository.server';
import type {MarketCollectionStatus} from '../lib/data-operations/market-status.server';
const source:CollectionStatus={sourceId:'sg-test',name:'test',market:'singapore',category:'cost',url:'https://example.com',mode:'page-monitor',intervalDays:7,limitation:'',lastSuccessAt:'2026-09-01T00:00:00Z',lastAttemptAt:'2026-09-01T00:00:00Z',nextDueAt:'2026-09-08T00:00:00Z',lastPublishedAt:null,consecutiveFailures:0,lastError:null,anomaly:null,newCount:0,changedCount:0,pendingCount:0,latestSnapshotId:null,probe:null,pendingCandidateCount:0,recordCount:0};
const job:MarketCollectionStatus={job:'jp-tokyo-sale',enabled:false,state:null,lastAttemptAt:null,lastSuccessAt:null,sourceAsOf:null,errorCode:null,received:0,inserted:0,updated:0,unchanged:0,unlinked:0,consecutiveFailures:0,anomaly:null};
const now=Date.parse('2026-09-14T00:00:00Z');
it('uses the actual schedule and does not label blocked collection overdue',()=>{
 expect(sourceSignals(source,now).overdue).toBe(true);
 expect(sourceSignals(source,null).overdue).toBe(false);
 expect(sourceSignals({...source,mode:'blocked'},now).overdue).toBe(false);
 expect(sourceSignals({...source,nextDueAt:null},now).overdue).toBe(true);
 expect(matchesSource(source,'overdue',now)).toBe(true);
});
it('keeps pending candidates, failures and disabled schedules distinct from publication',()=>{
 expect(matchesSource({...source,pendingCandidateCount:14},'review',now)).toBe(true);
 expect(matchesSource({...source,consecutiveFailures:2},'failed',now)).toBe(true);
 expect(matchesMarket(job,'blocked')).toBe(true);
 expect(matchesMarket(job,'unrun')).toBe(true);
 expect(matchesMarket(job,'failed')).toBe(false);
 expect(matchesMarket({...job,state:'succeeded',unlinked:10},'review')).toBe(false);
 expect(matchesMarket({...job,state:'failed'},'attention')).toBe(true);
 expect(matchesMarket({...job,lastSuccessAt:'2020-01-01'},'overdue')).toBe(false);
});
it('keeps missing times missing and labels city tasks',()=>{
 expect(mostRecent([null,'not-a-date'])).toBeNull();
 expect(mostRecent(['2026-09-01','2026-09-10',null])).toBe('2026-09-10');
 expect(marketJobLabel('jp-tokyo-sale')).toBe('도쿄 매매');
});
