import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {PropertyScenarioCalculator} from '../components/market-ui/property-scenario';
it('keeps Japanese cost assumptions manual and does not apply another country tax defaults',()=>{
 const html=renderToStaticMarkup(<PropertyScenarioCalculator currency="JPY" price={90000000}/>);
 expect(html).toContain('No tax rates or rent estimates are prefilled');
 expect(html).toContain('Purchase price (JPY)');
 expect(html).not.toContain('DLD');
 expect(html).not.toContain('Rules checked');
 expect(html).not.toContain('Calculated subtotal');
 expect(html).toContain('Complete every assumption');
});

it('renders the same scenario inputs in Chinese',()=>{ const html=renderToStaticMarkup(<PropertyScenarioCalculator locale="zh-CN" currency="JPY" price={90000000}/>); expect(html).toContain('购房价格 (JPY)'); expect(html).toContain('购置预算'); expect(html).toContain('系统不预填税率'); });

import {PropertyScenarioWorkspace} from '../components/tools/property-scenario-workspace';
import {parsePropertyScenarioContext} from '../lib/tools/property-scenario-context';
it('keeps Chinese scenario onward navigation in Chinese',()=>{
 const html=renderToStaticMarkup(<PropertyScenarioWorkspace locale="zh-CN" context={parsePropertyScenarioContext({market:'jp-tokyo',currency:'JPY'},'zh-CN')}/>);
 expect(html).toContain('href="/zh-cn/guides?market=tokyo"');
 expect(html).toContain('买房与租房指南');
 expect(html).not.toContain('href="/guides"');
});
