import { TokyoAreaMap } from './tokyo-area-map';
import { readTokyoAreaMapSummary, type TokyoAreaSummary } from '@/lib/japan/area-map-summary.server';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import type { TokyoMapFilters } from '@/lib/japan/map-summary.server';

export async function TokyoMapPanel({ city, year, quarter, filters }: { city: string; year: string; quarter: string; filters: TokyoMapFilters }) {
  let rows: TokyoAreaSummary[] = [];
  let unavailable = false;
  try { rows = await readTokyoAreaMapSummary(city, year, quarter, filters); } catch { unavailable = true; }
  return <TokyoAreaMap rows={rows} city={city} year={year} quarter={quarter} filters={filters} unavailable={unavailable} browserKey={googleMapsBrowserKeyFromEnvironment()} />;
}
