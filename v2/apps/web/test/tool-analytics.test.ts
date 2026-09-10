import {expect,it} from 'vitest';
import {createToolEvent,TOOL_EVENTS} from '../lib/analytics/tool-events';
it.each(TOOL_EVENTS)('keeps %s limited to coarse dimensions',event=>{
 expect(createToolEvent(event,{market:'kr-seoul',surface:'standalone-tool',tool:'property-scenario',price:1000,deposit:100,rent:50,entity:'secret',url:'secret',returnTo:'secret',property:'secret',search:'secret',userId:'secret'}))
 .toEqual({event,market:'kr-seoul',surface:'standalone-tool',tool:'property-scenario'});
});
it('rejects invalid dimensions',()=>{expect(()=>createToolEvent('tool_start',{market:'invalid' as never,surface:'standalone-tool',tool:'property-scenario'})).toThrow();});

it('accepts a Dubai Check start without retaining budget inputs',()=>{
 expect(createToolEvent('tool_start',{market:'ae-dubai',surface:'tools-hub',tool:'dubai-check',price:1500000})).toEqual({event:'tool_start',market:'ae-dubai',surface:'tools-hub',tool:'dubai-check'});
});
