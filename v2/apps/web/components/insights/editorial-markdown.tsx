import { Fragment, type ReactNode } from 'react';

import styles from './insights.module.css';

type Block = Readonly<{
  kind: 'heading' | 'subheading' | 'paragraph' | 'list';
  content: string | readonly string[];
}>;

export function parseEditorialMarkdown(source: string): readonly Block[] {
  const blocks: Block[] = [];
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ kind: 'paragraph', content: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length > 0) blocks.push({ kind: 'list', content: Object.freeze([...list]) });
    list = [];
  };
  for (const line of lines) {
    const value = line.trim();
    if (value === '') {
      flushParagraph();
      flushList();
    } else if (value.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'subheading', content: value.slice(4) });
    } else if (value.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading', content: value.slice(3) });
    } else if (value.startsWith('- ')) {
      flushParagraph();
      list.push(value.slice(2));
    } else {
      flushList();
      paragraph.push(value);
    }
  }
  flushParagraph();
  flushList();
  return Object.freeze(blocks);
}

export function EditorialMarkdown({ source }: Readonly<{ source: string }>) {
  const blocks = parseEditorialMarkdown(source);
  const firstParagraphBlockIndex = blocks.findIndex(({ kind }) => kind === 'paragraph');

  return (
    <div className={styles.articleBody} data-article-reading-width="720">
      {blocks.map((block, index): ReactNode => {
        const key = `${block.kind}-${index}`;
        if (block.kind === 'heading') return <h2 key={key}>{block.content as string}</h2>;
        if (block.kind === 'subheading') return <h3 key={key}>{block.content as string}</h3>;
        if (block.kind === 'list') return <ul key={key}>{(block.content as readonly string[]).map((item) => <li key={item}>{item}</li>)}</ul>;
        if (index !== firstParagraphBlockIndex) return <p key={key}>{block.content as string}</p>;
        return (
          <Fragment key={key}>
            <p data-article-paragraph="1">{block.content as string}</p>
            <aside
              aria-hidden="true"
              className={styles.adSlotEmpty}
              data-ad-slot="article-1"
              data-ad-state="empty"
            />
          </Fragment>
        );
      })}
    </div>
  );
}
