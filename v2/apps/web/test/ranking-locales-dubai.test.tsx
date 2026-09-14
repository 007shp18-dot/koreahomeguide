import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { rankDubaiProjects } from '../lib/rankings/dubai-ranking';
import { DubaiRankings } from '../components/rankings/dubai-rankings';
import { RankingControls } from '../components/rankings/ranking-controls';
import { RankingMarketsHub } from '../components/rankings/ranking-markets-hub';
import { languageDestinations } from '../lib/navigation/site-navigation';
import snapshot from '../data/dubai-project-evidence.json';
import type { DubaiProjectEvidence } from '../lib/dubai/project-evidence';
vi.mock('server-only',()=>({}));
vi.mock('next/navigation', async original=>({...await original<typeof import('next/navigation')>(),useRouter:()=>({push:vi.fn()})}));
vi.mock('../lib/rankings/contracts.server',()=>({contractRankings:vi.fn(async()=>({rows:[],checkedAt:'2026-09-14'})),regionalRentRankings:vi.fn(async()=>({rows:[],checkedAt:'2026-09-14'}))}));
const projects=snapshot.projects as DubaiProjectEvidence[];
describe('Dubai project ranking',()=>{
 it('keeps stages distinct and never fabricates 50 results',()=>{
  const ready=rankDubaiProjects(projects,'highest','ready');
  expect(ready).toHaveLength(1);
  const rows=rankDubaiProjects(projects,'highest','off-plan');
  expect(rows.length).toBeGreaterThan(1);
  expect(rows.every(r=>r.stage==='off-plan'&&r.housing==='apartment'&&r.n>=30)).toBe(true);
  expect(new Set(rows.map(r=>r.projectNumber)).size).toBe(rows.length);
  rows.slice(1).forEach((r,i)=>expect(r.medianPriceAed).toBeLessThanOrEqual(rows[i]!.medianPriceAed));
 });
 it('deduplicates before limiting and handles ascending prices, ties, and invalid samples',()=>{
  const base=projects[0]!;
  const data=[{...base,projectNumber:'a',id:'a',medianPriceAed:100},{...base,projectNumber:'a',id:'a2',medianPriceAed:200},{...base,projectNumber:'b',id:'b',medianPriceAed:100},{...base,projectNumber:'c',id:'c',medianPriceAed:300},{...base,projectNumber:'d',id:'d',n:29},{...base,projectNumber:'e',id:'e',medianPriceAed:NaN}];
  expect(rankDubaiProjects(data,'lowest').map(r=>[r.projectNumber,r.rank])).toEqual([['a',1],['b',1],['c',3]]);
 });
 it('does not expose project data when the approved context is unavailable',()=>{
  const html=renderToStaticMarkup(<DubaiRankings projects={projects} context={null} order="highest"/>);
  expect(html).toContain('temporarily unavailable');
  expect(html).not.toContain('<table>');
 });
});
describe('shared language structure',()=>{
 it.each(['en','ko','zh-CN'] as const)('%s renders the same four city options and local form action',locale=>{
  const html=renderToStaticMarkup(<RankingControls locale={locale} city="dubai" kind="sale" order="lowest"/>);
  expect([...html.matchAll(/<option value="(seoul|singapore|dubai|tokyo)"/g)].map(m=>m[1])).toEqual(['seoul','singapore','dubai','tokyo']);
  expect(html).toContain(`action="${locale==='en'?'':locale==='ko'?'/ko':'/zh-cn'}/rankings/"`);
 });
 it('keeps city, stage, rent cohort and order through language changes',()=>{
  const query='?city=singapore&kind=rent&order=lowest&area=60-90&beds=3';
  expect(languageDestinations('/ko/rankings/',query)).toEqual({en:'/rankings/'+query,ko:'/ko/rankings/'+query,'zh-CN':'/zh-cn/rankings/'+query});
  const html=renderToStaticMarkup(<RankingMarketsHub locale="ko" query={{city:'dubai',order:'lowest',stage:'ready'}}>{null}</RankingMarketsHub>);
  expect(html).toMatch(/\/zh-cn\/rankings\/?\?city=dubai&amp;order=lowest&amp;stage=ready/);
 });
 it('renders Tokyo’s same 50 records on every locale route',async()=>{
  const pages=[(await import('../app/(en)/rankings/page')).default,(await import('../app/(ko)/ko/rankings/page')).default,(await import('../app/(zh-cn)/zh-cn/rankings/page')).default];
  for(const Page of pages){
   const html=renderToStaticMarkup(await Page({searchParams:Promise.resolve({city:'tokyo'})}));
   expect(html.match(/scope="row"/g)).toHaveLength(50);
   expect(html).toContain('JPY 1,200,000,000');
  }
 });
 it('normalizes unsupported Dubai rent filters within the selected language',async()=>{
  const Page=(await import('../app/(ko)/ko/rankings/page')).default;
  await expect(Page({searchParams:Promise.resolve({city:'dubai',kind:'rent',order:'lowest',stage:'ready'})})).rejects.toMatchObject({digest:expect.stringContaining('/ko/rankings/?city=dubai&kind=sale&order=lowest&stage=ready')});
 });
});
