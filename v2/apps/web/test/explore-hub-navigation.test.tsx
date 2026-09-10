import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { GlobalProductHub } from '../components/global-product-hub';

it('uses the Explore name and offers four city destinations without obsolete Dubai research labels', () => {
  const html = renderToStaticMarkup(<GlobalProductHub kind="prices" />);
  expect(html).toMatch(/<h1[^>]*>Explore<\/h1>/);
  expect(html).not.toContain('Dubai research');
  expect(html).not.toContain('Individual transaction prices are not searchable yet');
  for (const city of ['kr/seoul','sg/singapore','ae/dubai','jp/tokyo']) {
    expect(html).toContain(`href="/${city}/explore`);
  }
  expect(html).toContain('<option value="tokyo">Tokyo</option>');
});
