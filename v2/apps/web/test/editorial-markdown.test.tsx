import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EditorialMarkdown } from '../components/insights/editorial-markdown';

describe('editorial body', () => {
  it('renders comparison tables, numbered steps and emphasis as readable content', () => {
    const html = renderToStaticMarkup(<EditorialMarkdown source={'Opening **context**.\n\n| Cost | Amount |\n| --- | --- |\n| Price | AED 1,500,000 |\n\n1. Check the source\n2. Compare the period'} />);
    expect(html).toContain('Opening <strong>context</strong>.');
    expect(html).toContain('<table>');
    expect(html).toContain('<th scope="col">Cost</th>');
    expect(html).toContain('<td>AED 1,500,000</td>');
    expect(html).toContain('<ol><li>Check the source</li><li>Compare the period</li></ol>');
  });
  it('escapes HTML and rejects unsafe link protocols', () => {
    const html = renderToStaticMarkup(<EditorialMarkdown source={'<script>bad</script> [bad](javascript:alert) [source](https://example.com/data)'} />);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('href="https://example.com/data"');
  });
});
