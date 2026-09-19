import type { EditorialPortfolioRecord } from '@/content/portfolio-types';
import { editorialImages } from '@/lib/insights/editorial-images';
import { insightPhoto } from '@/content/insight-photos';

type HomeArticlePhoto = { src: string; portrait: boolean; context?: 'property' | 'city'; alt?: string; credit?: { source: string; author: string; license: string; licenseHref: string } };

// A story's selected photograph takes precedence over generic city imagery.
export function homeArticlePhoto(record: EditorialPortfolioRecord): HomeArticlePhoto | undefined {
  if (record.propertyPhoto) {
    const photo = record.propertyPhoto;
    return { src: photo.src, portrait: false, context: 'property', alt: photo.buildingName,
      credit: { source: photo.sourceUrl, author: photo.attributionName, license: '', licenseHref: photo.attributionUrl ?? photo.sourceUrl } };
  }
  const uploaded = editorialImages(record.bodyMarkdown)[0];
  if (uploaded) return { src: uploaded.src, portrait: false };
  const selected = insightPhoto(record.slug);
  if (selected) return { src: selected.src, portrait: selected.height > selected.width, credit: { source: selected.source, author: selected.author, license: selected.license, licenseHref: selected.licenseUrl } };
  const src = ({ 'kr-seoul': 'seoul-ethan-yoo', 'sg-singapore': 'singapore-kevin-wang', 'ae-dubai': 'dubai-waqas-sultan', 'jp-tokyo': 'tokyo-christian-macmillan' } as Record<string, string>)[record.marketId ?? ''];
  return src ? { src: `/assets/home/${src}.jpg`, portrait: record.marketId === 'jp-tokyo', context: 'city' } : undefined;
}
