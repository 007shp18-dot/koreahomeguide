import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ToolsHub} from '../components/tools/tools-hub';
import {buildPropertyScenarioMetadata} from '../lib/tools/property-scenario-metadata';
import {SiteHeader} from '../components/site-header';
import {globalNavigation,languageDestinations} from '../lib/navigation/site-navigation';
it.each(['en','ko','zh-CN'] as const)('publishes a translated tools directory with five live actions: %s',locale=>{
 const html=renderToStaticMarkup(<ToolsHub locale={locale}/>);
 expect(html.match(/<h1\b/g)).toHaveLength(1);expect(html).not.toContain('Preparing');
 expect(globalNavigation(locale)).toHaveLength(5);
 expect(html).toContain('/sg/singapore/check');expect(html).toContain('/tools/property-scenario');
});
it.each(['en','ko'] as const)('keeps calculator parameters out of indexable metadata: %s',locale=>{
 const base=buildPropertyScenarioMetadata(locale,false), query=buildPropertyScenarioMetadata(locale,true);
 expect(base.robots).toEqual({index:true,follow:true});expect(query.robots).toEqual({index:false,follow:true});
 expect(base.alternates).toEqual(query.alternates);
 expect(languageDestinations('/tools/property-scenario/').ko).toBe('/ko/tools/property-scenario/');
});
it('selects only Tools for Check and only Prices for Explore',()=>{
 for(const [href,label] of [['/kr/seoul/check/','Tools'],['/ko/tools/property-scenario/','Tools'],['/kr/seoul/explore/','Prices']]) {
  const html=renderToStaticMarkup(<SiteHeader copy={{brand:'signedprice',homeLabel:'home',navigationLabel:'Local',links:[{label:'Current',href:href!,isCurrent:true}]}}/>);
  const nav=html.match(/<nav[^>]*aria-label="Primary navigation"[\s\S]*?<\/nav>/)?.[0] ?? '';
  expect(nav.match(/aria-current="page"/g)).toHaveLength(1);expect(nav).toMatch(new RegExp(`aria-current="page"[^>]*>${label}</a>`));
 }
});
