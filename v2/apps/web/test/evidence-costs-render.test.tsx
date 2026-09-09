import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PropertyScenarioCalculator } from '../components/market-ui/property-scenario';
it('withholds yield until operating costs are supplied, distinguishing unavailable evidence from zero cost', () => {
 const html = renderToStaticMarkup(<PropertyScenarioCalculator price={1000000} annualRent={60000} currency="SGD" costState="ready" />);
 expect(html).toContain('This does not mean costs are zero');
 expect(html).toContain('Complete every assumption to calculate');
 expect(html).toMatch(/id="[^"]+-annualCosts"[^>]*value=""/);
 expect(html).not.toContain('Operating yield on total cost</dt>');
});
it('shows cost provenance and an explicit conditional action without applying a quote automatically', () => {
 const html = renderToStaticMarkup(<PropertyScenarioCalculator price={1000000} annualRent={60000} currency="SGD" costState="ready" costOptions={[{id:'a',metric:'service_charge',basis:'quoted',currency:'SGD',annualAmount:3600,originalAmount:300,originalUnit:'monthly',building:'Test Tower',area:'District 1',conditions:'Excludes special levies',observedOn:'2026-09-01',observedLabel:'2026-09-01',expiresOn:'2026-12-31',sourceName:'Management',url:'https://example.com/fees'}]} />);
 expect(html).toContain('Excludes special levies'); expect(html).toContain('2026-09-01'); expect(html).toContain('quoted');
 expect(html).toContain('Confirm location and conditions'); expect(html).toContain('https://example.com/fees');
 expect(html).toContain('Complete every assumption to calculate');
});
