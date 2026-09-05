'use client';

import { track } from '@vercel/analytics/react';
import { useEffect } from 'react';

import {
  createEditorialEvent,
  type EditorialDestinationFamily,
  type EditorialEvent,
} from '../lib/analytics/editorial-events';
import type { ContentMarketId, ContentType } from '../lib/content/content-types';

const destinationByEvent: Readonly<Partial<Record<EditorialEvent, EditorialDestinationFamily>>> = Object.freeze({
  article_complete: 'article',
  article_to_explore: 'explore',
  article_to_check: 'check',
  policy_source_open: 'official-source',
  infographic_data_open: 'infographic-data',
});

function sendEditorialEvent(marker: HTMLElement) {
  const context = marker.closest<HTMLElement>('[data-editorial-content-id]');
  if (context === null) return;
  const event = marker.dataset.editorialEvent as EditorialEvent | undefined;
  const contentId = context.dataset.editorialContentId;
  const contentType = context.dataset.editorialContentType as ContentType | undefined;
  const locale = context.dataset.editorialLocale;
  const market = context.dataset.editorialMarket as ContentMarketId | undefined;
  if (event === undefined || contentId === undefined || contentType === undefined || locale === undefined || market === undefined) return;

  try {
    const payload = createEditorialEvent(event, {
      contentId,
      contentType,
      locale,
      market,
      ...(destinationByEvent[event] === undefined ? {} : { destinationFamily: destinationByEvent[event] }),
    });
    const { event: eventName, ...properties } = payload;
    track(eventName, properties);
  } catch {
    // Invalid or incomplete DOM metadata is never forwarded to analytics.
  }
}

export function EditorialAnalytics() {
  useEffect(() => {
    const completed = new WeakSet<Element>();
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const marker = event.target.closest<HTMLElement>('[data-editorial-event]');
      if (marker === null || marker.dataset.editorialEvent === 'article_complete') return;
      sendEditorialEvent(marker);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || completed.has(entry.target) || !(entry.target instanceof HTMLElement)) continue;
        completed.add(entry.target);
        sendEditorialEvent(entry.target);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.5 });

    document.addEventListener('click', handleClick, { capture: true });
    document.querySelectorAll('[data-editorial-event="article_complete"]').forEach((marker) => observer.observe(marker));
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      observer.disconnect();
    };
  }, []);

  return null;
}
