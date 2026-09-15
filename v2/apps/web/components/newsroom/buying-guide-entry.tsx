'use client';
import { useSearchParams } from 'next/navigation';
import type { BuyingGuideData } from '../../content/en/buying-guide-data';
import { BuyingGuide } from './buying-guide';

/** Keep guide pages static while reading the visitor's selected budget on the client. */
export function BuyingGuideEntry({ guide, locale }: { guide: BuyingGuideData; locale: 'en' | 'ko' }) {
  const params = useSearchParams();
  const budget = params.get('budget');
  return <BuyingGuide key={`${guide.slug}:${budget ?? ''}`} guide={guide} locale={locale} initialBudget={budget} />;
}
