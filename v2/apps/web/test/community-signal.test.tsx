import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CommunitySignal } from '../components/community/community-signal';
import {
  normalizeCommunityClientEnvelope,
} from '../components/community/community-signal-client';
import type { CommunitySignalModel } from '../lib/community/community-signal-model';

const scope = {
  marketId: 'kr-seoul',
  scopeType: 'district',
  scopeId: 'jung-gu',
  evidenceId: 'kr-seoul:2026-01/2026-07:area:v2:all',
} as const;

describe('Community signal UI', () => {
  it('keeps an honest visible module with no enabled form when storage is absent', () => {
    const model: CommunitySignalModel = {
      state: 'unavailable',
      scope,
      code: 'storage_not_configured',
    };
    const html = renderToStaticMarkup(<CommunitySignal model={model} />);

    expect(html).toContain('Community signal');
    expect(html).toContain('Community responses are not open yet');
    expect(html).toContain('Durable response storage is not configured');
    expect(html).not.toMatch(/<button(?![^>]*disabled)/);
    expect(html).not.toContain('<form');
  });

  it('reveals no count or breakdown while responses are collecting', () => {
    const model: CommunitySignalModel = {
      state: 'collecting',
      scope,
      selection: null,
      aggregate: { status: 'collecting' },
    };
    const html = renderToStaticMarkup(<CommunitySignal model={model} />);

    expect(html).toContain('Responses are being collected');
    expect(html).not.toMatch(/4 responses|Higher[^<]*\d|Similar[^<]*\d|Lower[^<]*\d/);
    expect(html).toContain('Compared with SignedPrice');
    expect(html).toContain('>Higher<');
    expect(html).toContain('>Similar<');
    expect(html).toContain('>Lower<');
  });

  it('renders threshold-safe totals, directions, reasons, and caller selection', () => {
    const model: CommunitySignalModel = {
      state: 'published',
      scope,
      selection: { direction: 'SIMILAR', reason: 'VIEW' },
      aggregate: {
        status: 'published',
        total: 7,
        directions: [
          { direction: 'HIGHER', count: 2, percent: 29 },
          { direction: 'SIMILAR', count: 2, percent: 28 },
          { direction: 'LOWER', count: 3, percent: 43 },
        ],
        reasons: [{ reason: 'VIEW', count: 5 }],
        otherResponses: 2,
      },
    };
    const html = renderToStaticMarkup(<CommunitySignal model={model} />);

    expect(html).toContain('7 community responses');
    expect(html).toContain('29%');
    expect(html).toContain('28%');
    expect(html).toContain('43%');
    expect(html).toContain('<dt>View</dt><dd>5</dd>');
    expect(html).toContain('<dt>Other responses</dt><dd>2</dd>');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Self-selected response, not a representative survey');
  });

  it('accepts only exact safe API envelopes and never turns an error into saved state', () => {
    expect(normalizeCommunityClientEnvelope({
      state: 'collecting',
      selection: { direction: 'LOWER', reason: null },
      aggregate: { status: 'collecting' },
    })).toMatchObject({ state: 'collecting', selection: { direction: 'LOWER' } });

    expect(normalizeCommunityClientEnvelope({
      state: 'collecting',
      selection: null,
      aggregate: { status: 'collecting' },
      saved: true,
    })).toBeNull();
    expect(normalizeCommunityClientEnvelope({
      state: 'unavailable', code: 'storage_unavailable',
    })).toBeNull();
  });

  it('keeps every control touch-sized, focused, and mobile-safe', () => {
    const css = readFileSync(new URL(
      '../components/community/community-signal.module.css', import.meta.url,
    ), 'utf8');

    expect(css).toMatch(/\.directionButton,[\s\S]*\.submitButton,[\s\S]*\.deleteButton[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/:focus-visible[\s\S]*outline:\s*2px solid var\(--community-accent\)[\s\S]*outline-offset:\s*2px/);
    expect(css).toMatch(/@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/max-width:\s*100%/);
  });
});
