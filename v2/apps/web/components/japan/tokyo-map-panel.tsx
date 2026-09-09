import { Suspense } from 'react';
import { TokyoAreaMap } from './tokyo-area-map';
import { readTokyoAreaMapSummary, type TokyoAreaSummary } from '@/lib/japan/area-map-summary.server';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import { readCachedTokyoMapSummary, type TokyoWardSummary } from '@/lib/japan/map-summary.server';
import { TokyoWardMap, type TokyoWardMapProps } from './tokyo-ward-map';

export async function TokyoMapPanel(props: Omit<TokyoWardMapProps, 'summaries'>) {
  let summaries: TokyoWardSummary[] | null = null;
  try { summaries = await readCachedTokyoMapSummary(props.year, props.quarter, props.filters); }
  catch { /* The map remains navigable and never blocks valid transaction results. */ }
  return <><TokyoWardMap {...props} summaries={summaries} /><Suspense fallback={null}><TokyoNeighbourhoodPanel {...props} /></Suspense></>;
}

async function TokyoNeighbourhoodPanel({ city, year, quarter }: { city: string; year: string; quarter: string }) {
  let rows: TokyoAreaSummary[] = [];
  try { rows = await readTokyoAreaMapSummary(city, year, quarter); } catch { /* Ward map remains available. */ }
  return <TokyoAreaMap key={`${city}:${year}:${quarter}`} rows={rows} city={city} year={year} quarter={quarter} browserKey={googleMapsBrowserKeyFromEnvironment()} />;
}
