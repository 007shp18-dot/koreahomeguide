import { NextResponse } from 'next/server';

import {
  approveBuildingPhoto,
  type PhotoApprovalInput,
} from '@/lib/photos/building-photo-store.server';

export const dynamic = 'force-dynamic';

function text(value: unknown, maximum: number): string | null {
  return typeof value === 'string' && value.trim() !== '' && value.length <= maximum ? value.trim() : null;
}

function httpUrl(value: unknown): string | null {
  const source = text(value, 2_000);
  if (source === null) return null;
  try {
    const url = new URL(source);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function approvalInput(value: unknown): PhotoApprovalInput | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const registryKey = text(item.registryKey, 240);
  const buildingKey = text(item.buildingKey, 240);
  const externalId = text(item.externalId, 240);
  const buildingName = text(item.buildingName, 240);
  const address = text(item.address, 500);
  const marketKey = item.marketKey;
  const provider = item.provider;
  const placeId = text(item.placeId, 500);
  const assetUrl = httpUrl(item.assetUrl);
  if (registryKey === null || buildingKey === null || externalId === null
    || buildingName === null || address === null
    || !['seoul', 'singapore', 'dubai'].includes(String(marketKey))
    || !['google-place', 'licensed-url', 'owned-object'].includes(String(provider))) return null;
  if ((provider === 'google-place' && placeId === null)
    || (provider !== 'google-place' && assetUrl === null)) return null;
  return Object.freeze({
    registryKey,
    marketKey: marketKey as PhotoApprovalInput['marketKey'],
    buildingKey,
    externalId,
    buildingName,
    address,
    provider: provider as PhotoApprovalInput['provider'],
    placeId: provider === 'google-place' ? placeId : null,
    assetUrl: provider === 'google-place' ? null : assetUrl,
    attributionName: text(item.attributionName, 240),
    attributionUrl: httpUrl(item.attributionUrl),
  });
}

export async function POST(request: Request) {
  const secret = process.env.CONTENT_ADMIN_SECRET?.trim();
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const input = approvalInput(body);
  if (input === null) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  try {
    await approveBuildingPhoto(input);
    return NextResponse.json({ state: 'approved', registryKey: input.registryKey });
  } catch (error) {
    console.error('SignedPrice photo approval failed.', error);
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }
}

