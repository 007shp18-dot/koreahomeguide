import type { EditorialPortfolioRecord } from '@/content/portfolio-types';
import { editorialImages } from '@/lib/insights/editorial-images';
import { insightPhoto } from '@/content/insight-photos';

// A story's selected photograph takes precedence over generic city imagery.
export function homeArticlePhoto(record: EditorialPortfolioRecord) {
  const uploaded = editorialImages(record.bodyMarkdown)[0];
  if (uploaded) return { src: uploaded.src, portrait: false };
  const selected = insightPhoto(record.slug);
  if (selected) return { src: selected.src, portrait: selected.height > selected.width };
  const src = ({ 'kr-seoul': 'seoul-ethan-yoo', 'sg-singapore': 'singapore-kevin-wang', 'ae-dubai': 'dubai-waqas-sultan', 'jp-tokyo': 'tokyo-christian-macmillan' } as Record<string, string>)[record.marketId ?? ''];
  return src ? { src: `/assets/home/${src}.jpg`, portrait: record.marketId === 'jp-tokyo' } : undefined;
}
