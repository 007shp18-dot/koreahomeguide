import { describe, expect, it } from 'vitest';

import {
  PUBLIC_EDITORIAL_SURFACES,
  publicEditorialHref,
  publicEditorialLanguageHref,
} from '../lib/editorial-growth/public-editorial-routes';

describe('public editorial routes', () => {
  it('maps every approved surface to a stable English and Chinese URL', () => {
    expect(publicEditorialHref('home', 'en')).toBe('/');
    expect(publicEditorialHref('content', 'en')).toBe('/insights/');
    expect(publicEditorialHref('check', 'zh-CN')).toBe('/zh-cn/kr/seoul/check/');
    expect(publicEditorialHref('explore', 'zh-CN')).toBe('/zh-cn/kr/seoul/explore/');
    expect(JSON.stringify(PUBLIC_EDITORIAL_SURFACES)).not.toContain('/design-review/');
  });

  it('switches language without changing the current surface', () => {
    expect(publicEditorialLanguageHref('content', 'en')).toBe('/insights/');
    expect(publicEditorialLanguageHref('content', 'zh-CN')).toBe('/zh-cn/kr/seoul/insights/');
  });
});
