'use client';

import { useState, type FormEvent } from 'react';

import { EditorialMarkdown } from './editorial-markdown';
import styles from './insights.module.css';

const starterBody = `## Report question

Write the question this report answers.

## Evidence reviewed

Describe the market, period, property type, source and sample boundary.

## What the evidence shows

Explain the finding without overstating what the data can prove.

## What remains unknown

Record missing facts, thin samples and checks that still need to be completed.`;

export function EditorialEditor() {
  const [secret, setSecret] = useState('');
  const [slug, setSlug] = useState('');
  const [marketKey, setMarketKey] = useState('global');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState(starterBody);
  const [status, setStatus] = useState('draft');
  const [result, setResult] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const response = await fetch('/api/internal/content-articles/', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
        body: JSON.stringify({ slug, marketKey, title, summary, bodyMarkdown, status }),
      });
      const value = await response.json() as Readonly<{ error?: unknown }>;
      if (!response.ok) throw new Error(value.error === 'unauthorized' ? 'Admin secret is not correct.' : 'The article could not be saved.');
      setResult({ tone: 'success', message: status === 'published' ? 'Published. The report is now available in Insights.' : 'Saved. This article remains private.' });
    } catch (error) {
      setResult({ tone: 'error', message: error instanceof Error ? error.message : 'The article could not be saved.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.editorMain}>
      <header className={styles.editorHero}><p>Private editorial workspace</p><h1>Write a SignedPrice report.</h1><p>The admin secret is sent only with this save request and is never stored in the browser.</p></header>
      <div className={styles.editorLayout}>
        <form className={styles.editorForm} onSubmit={(event) => { void submit(event); }}>
          <label>Content admin secret<input required type="password" autoComplete="current-password" value={secret} onChange={(event) => setSecret(event.target.value)} /></label>
          <div className={styles.editorRow}>
            <label>Market<select value={marketKey} onChange={(event) => setMarketKey(event.target.value)}><option value="global">Global</option><option value="seoul">Seoul</option><option value="singapore">Singapore</option><option value="dubai">Dubai</option></select></label>
            <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">Draft</option><option value="review">Review</option><option value="published">Published</option></select></label>
          </div>
          <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="seoul-apartment-market-report" value={slug} onChange={(event) => setSlug(event.target.value)} /></label>
          <label>Headline<input required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label>Summary<textarea required maxLength={600} rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
          <label>Article body<textarea required className={styles.bodyInput} rows={20} value={bodyMarkdown} onChange={(event) => setBodyMarkdown(event.target.value)} /></label>
          <p className={styles.editorHelp}>Use <code>## Heading</code>, <code>### Subheading</code>, blank lines and <code>- list item</code>. Raw HTML is never rendered.</p>
          <button disabled={saving} type="submit">{saving ? 'Saving…' : status === 'published' ? 'Publish report' : 'Save article'}</button>
          {result === null ? null : <p className={styles[`result_${result.tone}`]} role="status">{result.message}</p>}
        </form>
        <aside className={styles.editorPreview}><p>Live preview</p><h2>{title || 'Untitled report'}</h2><p className={styles.previewSummary}>{summary || 'The article summary will appear here.'}</p><EditorialMarkdown source={bodyMarkdown} /></aside>
      </div>
    </main>
  );
}
