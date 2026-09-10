import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  OneMapLocationPanel,
  type OneMapLocationCandidate,
} from '../components/evidence-admin/onemap-location-panel';

const candidate: OneMapLocationCandidate = {
  id: '01234567-89ab-4cde-8f01-23456789abcd',
  version: 2,
  status: 'pending',
  entityId: 'sg-singapore:block:1-beach-rd',
  providerKey: '["1","BEACH RD"]',
  block: '1',
  street: 'BEACH RD',
  addressText: '1 BEACH ROAD SINGAPORE 189673',
  postalCode: '189673',
  latitude: 1.2996,
  longitude: 103.8562,
  contentHash: 'a'.repeat(64),
  fetchedAt: '2026-09-10T01:00:00Z',
  isCurrent: true,
};

describe('OneMap location review panel', () => {
  it('keeps collection separate from individual review and exposes licence provenance', () => {
    const html = renderToStaticMarkup(<OneMapLocationPanel initialData={{
      items: [candidate],
      page: 1,
      total: 1,
    }} />);

    expect(html).toContain('OneMap 250건 지금 수집');
    expect(html).toContain('수집만으로 사이트 좌표가 바뀌지 않으며');
    expect(html).toContain('1 BEACH ROAD SINGAPORE 189673');
    expect(html).toContain('우편번호 189673');
    expect(html).toContain('Singapore Open Data Licence');
    expect(html).toContain('비밀번호는 화면·로그·데이터베이스에 저장하지 않습니다');
  });

  it('shows each review state as a selectable list', () => {
    const html = renderToStaticMarkup(<OneMapLocationPanel initialData={{
      items: [],
      page: 1,
      total: 0,
    }} />);

    expect(html).toContain('검토 대기');
    expect(html).toContain('승인');
    expect(html).toContain('제외');
    expect(html).toContain('이 상태의 위치 후보가 없습니다.');
  });
});
