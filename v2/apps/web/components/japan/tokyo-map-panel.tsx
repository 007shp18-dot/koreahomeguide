import type { TokyoLocale } from './tokyo-copy';
import { cache } from 'react';
import { TokyoAreaMap } from './tokyo-area-map';
import { readTokyoAreaMapSummary, type TokyoAreaSummary } from '@/lib/japan/area-map-summary.server';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import type { TokyoMapFilters } from '@/lib/japan/map-summary.server';

// Both columns share one request, including on a cold cache or a source outage.
const readPanel = cache((city: string, year: string, quarter: string, filterKey: string) =>
  readTokyoAreaMapSummary(city, year, quarter, JSON.parse(filterKey) as TokyoMapFilters));

export async function TokyoMapPanel({ city, year, quarter, filters, locale = 'en', view = 'combined' }: { view?: 'combined' | 'directory' | 'map'; locale?: TokyoLocale; city: string; year: string; quarter: string; filters: TokyoMapFilters }) {
  let rows: TokyoAreaSummary[] = [];
  let unavailable = false;
  // Keep sibling neighbourhoods discoverable after choosing one. Property and
  // area filters still apply, but a neighbourhood search must not erase the map.
  try { rows = await readPanel(city, year, quarter, JSON.stringify({ ...filters, q: '' })); } catch { unavailable = true; }
  return <TokyoAreaMap view={view} locale={locale} rows={rows} city={city} year={year} quarter={quarter} filters={filters} unavailable={unavailable} browserKey={googleMapsBrowserKeyFromEnvironment()} />;
}
