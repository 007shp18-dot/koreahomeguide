import { Fragment, type ReactNode } from 'react';
import styles from './insights.module.css';

type Block = Readonly<{
  kind: 'heading' | 'subheading' | 'paragraph' | 'list' | 'ordered' | 'table';
  content: string | readonly string[];
}>;

export function parseEditorialMarkdown(source: string): readonly Block[] {
  const blocks: Block[] = [];
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  for (let index = 0; index < lines.length;) {
    const line = lines[index]!.trim();
    if (!line) { index++; continue; }
    if (/^\|.*\|$/.test(line) && /^\|?\s*:?-{3,}/.test(lines[index + 1]?.trim() ?? '')) {
      const rows = [line]; index += 2;
      while (index < lines.length && /^\|.*\|$/.test(lines[index]!.trim())) rows.push(lines[index++]!.trim());
      blocks.push({ kind: 'table', content: rows }); continue;
    }
    if (/^#{2,3} /.test(line)) {
      blocks.push({ kind: line.startsWith('### ') ? 'subheading' : 'heading', content: line.replace(/^#{2,3} /, '') }); index++; continue;
    }
    if (/^(?:[-*] |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line), items: string[] = [];
      const pattern = ordered ? /^\d+\. / : /^[-*] /;
      while (index < lines.length && pattern.test(lines[index]!.trim())) items.push(lines[index++]!.trim().replace(pattern, ''));
      blocks.push({ kind: ordered ? 'ordered' : 'list', content: items }); continue;
    }
    const paragraph = [line]; index++;
    while (index < lines.length && lines[index]!.trim() && !/^(?:#{2,3} |[-*] |\d+\. |\|)/.test(lines[index]!.trim())) paragraph.push(lines[index++]!.trim());
    blocks.push({ kind: 'paragraph', content: paragraph.join(' ') });
  }
  return blocks;
}

function inline(source: string): ReactNode[] {
  return source.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\))/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link && /^(?:https?:\/\/|\/(?!\/)|#)/i.test(link[2]!)) return <a key={index} href={link[2]}>{link[1]}</a>;
    return part;
  });
}

export function EditorialMarkdown({ source }: Readonly<{ source: string }>) {
  const blocks = parseEditorialMarkdown(source);
  const firstParagraph = blocks.findIndex(({ kind }) => kind === 'paragraph');
  return <div className={styles.articleBody} data-article-reading-width="720">
    {blocks.map((block, index): ReactNode => {
      const key = `${block.kind}-${index}`;
      if (block.kind === 'heading') return <h2 key={key}>{inline(block.content as string)}</h2>;
      if (block.kind === 'subheading') return <h3 key={key}>{inline(block.content as string)}</h3>;
      if (block.kind === 'list' || block.kind === 'ordered') {
        const Tag = block.kind === 'ordered' ? 'ol' : 'ul';
        return <Tag key={key}>{(block.content as readonly string[]).map((item, i) => <li key={i}>{inline(item)}</li>)}</Tag>;
      }
      if (block.kind === 'table') {
        const rows = (block.content as readonly string[]).map(row => row.slice(1, -1).split('|').map(cell => cell.trim()));
        return <div key={key} className={styles.markdownTable} tabIndex={0} role="region" aria-label="Article comparison table"><table><thead><tr>{rows[0]!.map((cell, i) => <th scope="col" key={i}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>;
      }
      return <Fragment key={key}><p data-article-paragraph={index === firstParagraph ? '1' : undefined}>{inline(block.content as string)}</p>{index === firstParagraph ? <aside aria-hidden="true" className={styles.adSlotEmpty} data-ad-slot="article-1" data-ad-state="empty" /> : null}</Fragment>;
    })}
  </div>;
}
