import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';

const config = JSON.parse(readFileSync(fileURLToPath(new URL('../vercel.json',import.meta.url)),'utf8')) as {
  crons: readonly Readonly<{path:string;schedule:string}>[];
};

describe('Vercel usage controls',()=>{
  it('batches non-urgent enrichment and media maintenance every six hours',()=>{
    expect(config.crons).toEqual(expect.arrayContaining([
      {path:'/api/internal/building-enrichment/?source=wikimedia&limit=60',schedule:'7 */6 * * *'},
      {path:'/api/internal/building-enrichment/?source=official&limit=250',schedule:'17 */6 * * *'},
      {path:'/api/internal/building-enrichment/?source=google&limit=30',schedule:'47 */6 * * *'},
      {path:'/api/internal/public-entity-projection/?mediaOnly=1',schedule:'57 */6 * * *'},
      {path:'/api/internal/photo-source-recovery/',schedule:'31 */6 * * *'},
    ]));
  });

  it('keeps bounded Japan backfill and editorial publication schedules',()=>{
    expect(config.crons).toEqual(expect.arrayContaining([
      {path:'/api/internal/japan-refresh/',schedule:'*/5 * * * *'},
      {path:'/api/internal/editorial-publish/',schedule:'*/15 * * * *'},
    ]));
  });

  it.each([
    '../app/(en)/sg/singapore/page.tsx',
    '../app/(en)/sg/singapore/rankings/page.tsx',
    '../app/(en)/sg/singapore/check/page.tsx',
    '../app/(en)/sg/singapore/explore/page.tsx',
    '../app/(en)/sg/singapore/explore/[area]/page.tsx',
    '../app/(en)/sg/singapore/explore/[area]/[projectId]/page.tsx',
    '../app/(ko)/ko/sg/singapore/page.tsx',
    '../app/(ko)/ko/sg/singapore/rankings/page.tsx',
    '../app/(ko)/ko/sg/singapore/check/page.tsx',
    '../app/(ko)/ko/sg/singapore/explore/page.tsx',
    '../app/(ko)/ko/sg/singapore/explore/[area]/page.tsx',
    '../app/(ko)/ko/sg/singapore/explore/[area]/[projectId]/page.tsx',
  ])('keeps %s on an hourly fallback ISR window',relativePath=>{
    const source=readFileSync(fileURLToPath(new URL(relativePath,import.meta.url)),'utf8');
    expect(source).toContain('export const revalidate = 3_600;');
    expect(source).not.toContain('export const revalidate = 60;');
  });
});
