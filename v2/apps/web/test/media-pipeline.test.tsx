import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {mediaPipeline} from '../lib/photos/media-pipeline.server';
import {MediaPipelinePanel} from '../components/evidence-admin/media-pipeline-panel';
import {reconcilePhotoCoverage} from '../lib/photos/photo-coverage-store.server';
it('drains multiple changed pages and stops when exhausted',async()=>{
 const sync=vi.fn().mockResolvedValueOnce({updated:300}).mockResolvedValueOnce({updated:300}).mockResolvedValueOnce({updated:19});
 expect(await reconcilePhotoCoverage(sync,()=>0)).toEqual({updated:619,complete:true});expect(sync).toHaveBeenCalledTimes(3);
});
it('stops a full backlog at the time budget for the next scheduled run',async()=>{
 let time=0;const sync=vi.fn(async()=>{time+=12000;return {updated:300,checked:300};});
 expect(await reconcilePhotoCoverage(sync,()=>time)).toEqual({updated:600,complete:false});expect(sync).toHaveBeenCalledTimes(2);
});
it('uses all canonical entities as denominator and separates publication from approval',async()=>{
 const rows=await mediaPipeline({query:vi.fn().mockResolvedValue([
 {market:'sg-singapore',kind:'project',stage:'published',count:20,coordinates:20,public_coordinates:18},
 {market:'sg-singapore',kind:'project',stage:'publication-pending',count:5,coordinates:5,public_coordinates:5},
 {market:'sg-singapore',kind:'block',stage:'rights-blocked',count:75,coordinates:0,public_coordinates:0},
 ])});
 const html=renderToStaticMarkup(<MediaPipelinePanel rows={rows}/>);
 expect(html).toContain('100개 대상');expect(html).toContain('20 (20.0%)');expect(html).toContain('25 (25.0%)');expect(html).toContain('23 (23.0%)');
 expect(html).toContain('승인 후 공개 연결 대기');expect(html).toContain('이용 권한 미확인');expect(html).toContain('도쿄는 익명 지역 거래');
});
