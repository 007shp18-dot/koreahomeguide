import { NextResponse } from 'next/server';

import {
  HDB_DATASETS,
  downloadHdbCsv,
  type HdbDataset,
} from '@/lib/singapore/hdb-download.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: Readonly<{ params: Promise<Readonly<{ dataset: string }>> }>,
) {
  const { dataset } = await params;
  if (!Object.prototype.hasOwnProperty.call(HDB_DATASETS, dataset)) {
    return NextResponse.json({ error: 'Unknown HDB dataset.' }, { status: 404 });
  }
  try {
    const result = await downloadHdbCsv(dataset as HdbDataset);
    return new NextResponse(result.csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Disposition': `attachment; filename="hdb-${dataset}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'HDB dataset unavailable.' }, { status: 503 });
  }
}
