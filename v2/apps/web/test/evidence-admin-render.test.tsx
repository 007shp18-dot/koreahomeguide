import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { EvidenceAdmin } from '../components/evidence-admin/workspace';
import { EvidenceForm } from '../components/evidence-admin/forms';
import type { PoolData } from '../lib/evidence-pool/contract';
import type { Evidence, Source } from '../lib/evidence-pool/contract';
const empty: PoolData = { sources: [], evidence: [], total: 0, page: 1, counts: { pending: 0, approved: 0, rejected: 0, withdrawn: 0, expired: 0 } };
describe('evidence admin surfaces', () => {
  it('renders a password login without exposing internal rows to an anonymous view', () => {
    const html = renderToStaticMarkup(<EvidenceAdmin initialAuthenticated={false} />);
    expect(html).toContain('type="password"'); expect(html).toContain('관리자 로그인');
    expect(html).not.toContain('자료 등록하기');
  });
  it('shows an honest empty workspace with a source-first next action', () => {
    const html = renderToStaticMarkup(<EvidenceAdmin initialAuthenticated initialData={empty} />);
    expect(html).toContain('등록된 자료가 없습니다'); expect(html).toContain('출처 관리');
    expect(html).not.toContain('Dubai Marina');
  });
  it('prevents evidence submission without a source and separates value bases', () => {
    const html = renderToStaticMarkup(<EvidenceForm sources={[]} busy={false} submit={async () => false} />);
    expect(html).toContain('먼저 출처를 등록하세요'); expect(html).toContain('disabled');
    expect(html).toContain('실제 지급액'); expect(html).toContain('청구액');
    expect(html).not.toContain('name="author"');
  });
  it('requires explicit replacement when a correction source has been withdrawn', () => {
    const current: Source = { id: '11111111-1111-4111-8111-111111111111', name: 'Original', url: 'https://original.example', kind: 'official', status: 'withdrawn', version: 2, createdAt: '' };
    const other: Source = { ...current, id: '22222222-2222-4222-8222-222222222222', name: 'Other', status: 'approved' };
    const row: Evidence = { id: '33333333-3333-4333-8333-333333333333', sourceId: current.id, market: 'dubai', tier: 'essential', metric: 'rent', basis: 'paid', amount: 1, currency: 'AED', unit: 'annual', area: 'Marina', building: '', sizeSqm: null, observedOn: '2026-09-01', expiresOn: '2026-10-01', url: 'https://original.example/rent', status: 'approved', version: 1, createdAt: '', sourceStatus: 'withdrawn', sourceKind: 'official', sourceName: 'Original' };
    const html = renderToStaticMarkup(<EvidenceForm sources={[current, other]} busy={false} submit={async () => false} existing={row} />);
    expect(html).toMatch(/<option value="" disabled="" selected="">/);
    expect(html).toContain('출처를 직접 다시 선택');
  });
});
