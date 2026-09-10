import type { TokyoLocale } from './tokyo-copy';
import { TokyoAreaMap } from './tokyo-area-map';
import { readTokyoAreaMapSummary, type TokyoAreaSummary } from '@/lib/japan/area-map-summary.server';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import type { TokyoMapFilters } from '@/lib/japan/map-summary.server';

export async function TokyoMapPanel({ city, year, quarter, filters, locale = 'en' }: { locale?: TokyoLocale; city: string; year: string; quarter: string; filters: TokyoMapFilters }) {
  let rows: TokyoAreaSummary[] = [];
  let unavailable = false;
  // Keep sibling neighbourhoods discoverable after choosing one. Property and
  // area filters still apply, but a neighbourhood search must not erase the map.
  try { rows = await readTokyoAreaMapSummary(city, year, quarter, { ...filters, q: '' }); } catch { unavailable = true; }
  return <TokyoAreaMap locale={locale} rows={rows} city={city} year={year} quarter={quarter} filters={filters} unavailable={unavailable} browserKey={googleMapsBrowserKeyFromEnvironment()} />;
}
