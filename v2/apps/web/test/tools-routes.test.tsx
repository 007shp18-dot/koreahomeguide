import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ToolsHub} from '../components/tools/tools-hub';
import {buildPropertyScenarioMetadata} from '../lib/tools/property-scenario-metadata';
import {SiteHeader} from '../components/site-header';
import {globalNavigation,languageDestinations} from '../lib/navigation/site-navigation';
import {metadata as koreanToolsMetadata} from '../app/(ko)/ko/tools/page';
it('uses Korean social images for the Korean directory and calculator',()=>{
 for(const metadata of [koreanToolsMetadata,buildPropertyScenarioMetadata('ko',false)]) {
  expect(metadata.openGraph?.images).toEqual(['https://www.signedprice.com/og/ko/']);
  expect(metadata.twitter?.images).toEqual(['https://www.signedprice.com/og/ko/']);
 }
});
it.each(['en','ko','zh-CN'] as const)('publishes a translated tools directory with all three market checks: %s',locale=>{
 const html=renderToStaticMarkup(<ToolsHub locale={locale}/>);
 expect(html.match(/<h1\b/g)).toHaveLength(1);expect(html).not.toContain('Preparing');
 expect(globalNavigation(locale)).toHaveLength(4);
 expect(html).toContain('/ae/dubai/check');expect(html).toContain('/sg/singapore/check');expect(html).toContain('/tools/property-scenario');
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
it.each(['en','ko'] as const)('keeps calculator parameters out of indexable metadata: %s',locale=>{
 const base=buildPropertyScenarioMetadata(locale,false), query=buildPropertyScenarioMetadata(locale,true);
 expect(base.robots).toEqual({index:true,follow:true});expect(query.robots).toEqual({index:false,follow:true});
 expect(base.alternates).toEqual(query.alternates);
 expect(languageDestinations('/tools/property-scenario/').ko).toBe('/ko/tools/property-scenario/');
});
it('selects only Tools for Check and Explore for search or ranking pages',()=>{
 for(const [href,label] of [['/kr/seoul/check/','Tools'],['/ko/tools/property-scenario/','Tools'],['/kr/seoul/explore/','Explore'],['/kr/seoul/rankings/','Explore']]) {
  const html=renderToStaticMarkup(<SiteHeader copy={{brand:'signedprice',homeLabel:'home',navigationLabel:'Local',links:[{label:'Current',href:href!,isCurrent:true}]}}/>);
  const nav=html.match(/<nav[^>]*aria-label="Primary navigation"[\s\S]*?<\/nav>/)?.[0] ?? '';
  expect(nav.match(/aria-current="page"/g)).toHaveLength(1);expect(nav).toMatch(new RegExp(`aria-current="page"[^>]*>${label}</a>`));
 }
});
