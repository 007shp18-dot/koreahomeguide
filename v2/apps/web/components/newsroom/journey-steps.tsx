'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { STORY_STEPS } from '../../content/city-journey-routes';
import type { StoryLocale } from '../../content/city-stories';
import styles from './newsroom-journey.module.css';

export type JourneyStepSummary = Readonly<{ id: string; title: string; deck: string; href: string; related: readonly Readonly<{ href: string; label: string }>[] }>;

export function JourneySteps({ stages, locale }: Readonly<{ stages: readonly JourneyStepSummary[]; locale: StoryLocale }>) {
  const [selected, select] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const section = stages[selected]!;
  return <div>
    <div className={styles.steps} role="tablist" aria-label={locale === 'ko' ? '주택 구매 여정' : 'Your buying journey'}>
      {STORY_STEPS.map((step, index) => <button key={step.id} ref={el => { buttons.current[index] = el; }} type="button" role="tab" id={`step-${step.id}`} aria-controls={`panel-${step.id}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onClick={() => select(index)} onKeyDown={event => {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 5 : ['ArrowRight', 'ArrowDown'].includes(event.key) ? (index + 1) % 6 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? (index + 5) % 6 : null;
        if (next !== null) { event.preventDefault(); select(next); buttons.current[next]?.focus(); }
      }}><span>{String(index + 1).padStart(2, '0')}</span>{step.label[locale]}</button>)}
    </div>
    <div className={styles.stepPanel} role="tabpanel" id={`panel-${section.id}`} aria-labelledby={`step-${section.id}`} tabIndex={0}>
      <div><p className={styles.eyebrow}>{STORY_STEPS[selected]!.question[locale]}</p><h3><Link href={section.href}>{section.title}</Link></h3><p>{section.deck}</p><nav className={styles.articleLinks} aria-label={locale === 'ko' ? '함께 읽기' : 'Related reading'}>{section.related.map(link => <Link key={link.href} href={link.href}>{link.label} ↗</Link>)}</nav></div>
      <Link className={styles.readLink} href={section.href}>{locale === 'ko' ? '상세 기사 읽기' : 'Read this article'} ↗</Link>
    </div>
  </div>;
}
