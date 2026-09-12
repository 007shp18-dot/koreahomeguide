import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ToolsHub} from '../components/tools/tools-hub';
import {buildPropertyScenarioMetadata} from '../lib/tools/property-scenario-metadata';
import {SiteHeader} from '../components/site-header';
import {globalNavigation,languageDestinations,marketDestination} from '../lib/navigation/site-navigation';
import {metadata as koreanToolsMetadata} from '../app/(ko)/ko/tools/page';
it('uses Korean social images for the Korean directory and calculator',()=>{
 for(const metadata of [koreanToolsMetadata,buildPropertyScenarioMetadata('ko',false)]) {
  expect(metadata.openGraph?.images).toEqual(['https://www.signedprice.com/og.png']);
  expect(metadata.twitter?.images).toEqual(['https://www.signedprice.com/og.png']);
 }
});
it.each(['en','ko','zh-CN'] as const)('publishes a translated tools directory with all four market tools: %s',locale=>{
 const html=renderToStaticMarkup(<ToolsHub locale={locale}/>);
 expect(html.match(/<h1\b/g)).toHaveLength(1);expect(html).not.toContain('Preparing');
 expect(globalNavigation(locale)).toHaveLength(6);
 expect(html).toContain('/jp/tokyo/tools');expect(html).toContain('/ae/dubai/check');expect(html).toContain('/sg/singapore/check');expect(html).toContain('/tools/property-scenario');
});
it('groups every existing tool once by decision',()=>{
 const html=renderToStaticMarkup(<ToolsHub locale="en"/>);
 const headings=['Check a price','Compare','Costs & returns'];
 const positions=headings.map(heading=>html.indexOf(`>${heading.replace('&','&amp;')}</h2>`));
 expect(positions.every(position=>position>=0)).toBe(true);
 expect(positions).toEqual([...positions].sort((left,right)=>left-right));
 for(const tool of ['passport','single-quote','offer-compare','rent-check','property-scenario','singapore-check','dubai-check'])
  expect(html.match(new RegExp(`data-tool-id="${tool}"`,'g'))).toHaveLength(1);
});
it.each(['en','ko','zh-CN'] as const)('keeps calculator parameters out of indexable metadata: %s',locale=>{
 const base=buildPropertyScenarioMetadata(locale,false), query=buildPropertyScenarioMetadata(locale,true);
 expect(base.robots).toEqual({index:true,follow:true});expect(query.robots).toEqual({index:false,follow:true});
 expect(base.alternates).toEqual(query.alternates);
 expect(languageDestinations('/tools/property-scenario/').ko).toBe('/ko/tools/property-scenario/');
});
it('selects only Tools for Check and Explore for search or ranking pages',()=>{
 for(const [href,label] of [['/kr/seoul/check/','Tools'],['/ko/tools/property-scenario/','Tools'],['/kr/seoul/explore/','Explore'],['/kr/seoul/rankings/','Rankings']]) {
  const html=renderToStaticMarkup(<SiteHeader copy={{brand:'signedprice',homeLabel:'home',navigationLabel:'Local',links:[{label:'Current',href:href!,isCurrent:true}]}}/>);
  const nav=html.match(/<nav[^>]*aria-label="Primary navigation"[\s\S]*?<\/nav>/)?.[0] ?? '';
  expect(nav.match(/aria-current="page"/g)).toHaveLength(1);expect(nav).toMatch(new RegExp(`aria-current="page"[^>]*>${label}</a>`));
 }
});

it('gives Chinese calculator metadata its own canonical and reciprocal language alternates',()=>{
 const chinese=buildPropertyScenarioMetadata('zh-CN',false);
 expect(chinese.alternates?.canonical).toBe('https://www.signedprice.com/zh-cn/tools/property-scenario/');
 expect(chinese.openGraph).toMatchObject({locale:'zh_CN',url:'https://www.signedprice.com/zh-cn/tools/property-scenario/'});
 expect(chinese.openGraph?.images).toEqual(['https://www.signedprice.com/og.png']);
 for(const locale of ['en','ko','zh-CN'] as const) expect(buildPropertyScenarioMetadata(locale,false).alternates?.languages).toEqual({
  en:'https://www.signedprice.com/tools/property-scenario/',ko:'https://www.signedprice.com/ko/tools/property-scenario/',
  'zh-Hans':'https://www.signedprice.com/zh-cn/tools/property-scenario/','x-default':'https://www.signedprice.com/tools/property-scenario/',
 });
});

it('keeps market tools in the agreed country order: Korea, Singapore, Dubai, Japan',()=>{
 const html=renderToStaticMarkup(<ToolsHub locale="en"/>);
 const order=['single-quote','singapore-check','dubai-check','tokyo-budget'].map(tool=>html.indexOf(`data-tool-id="${tool}"`));
 expect(order).toEqual([...order].sort((left,right)=>left-right));
});

it('retains the Tokyo tool and its inputs across all three languages',()=>{
 expect(languageDestinations('/jp/tokyo/tools/', '?city=13103&area=60&price=90000000')).toEqual({
  en:'/jp/tokyo/tools/?city=13103&area=60&price=90000000',
  ko:'/ko/jp/tokyo/tools/?city=13103&area=60&price=90000000',
  'zh-CN':'/zh-cn/jp/tokyo/tools/?city=13103&area=60&price=90000000',
 });
});

it('keeps the price-check task when switching away from Japan',()=>{
 expect(marketDestination('kr-seoul','/jp/tokyo/tools/','ko')).toBe('/ko/kr/seoul/check/');
 expect(marketDestination('sg-singapore','/jp/tokyo/tools/','zh-CN')).toBe('/zh-cn/sg/singapore/check/');
});

it('opens translated price tools from the Chinese directory',()=>{
 const html=renderToStaticMarkup(<ToolsHub locale="zh-CN"/>);
 for(const path of ['/kr/seoul/check','/sg/singapore/check','/ae/dubai/check','/jp/tokyo/tools']) {
  expect(html).toContain(`href="/zh-cn${path}`);
 }
 expect(html).not.toContain(' · English');
});
