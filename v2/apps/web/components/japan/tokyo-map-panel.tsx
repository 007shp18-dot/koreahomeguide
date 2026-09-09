import { readCachedTokyoMapSummary, type TokyoWardSummary } from '@/lib/japan/map-summary.server';
import { TokyoWardMap, type TokyoWardMapProps } from './tokyo-ward-map';

export async function TokyoMapPanel(props: Omit<TokyoWardMapProps, 'summaries'>) {
  let summaries: TokyoWardSummary[] | null = null;
  try { summaries = await readCachedTokyoMapSummary(props.year, props.quarter, props.filters); }
  catch { /* The map remains navigable and never blocks valid transaction results. */ }
  return <TokyoWardMap {...props} summaries={summaries} />;
}
