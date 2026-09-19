import type { ContentLocale, PublishedArticlePhoto } from './content-types';

function httpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}

/** Only consume the explicit, rights-checked article/entity join from the reader. */
export function articlePhotoFromRow(value: unknown): PublishedArticlePhoto | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  if (!httpsUrl(row.src) || !httpsUrl(row.sourceUrl)
    || typeof row.entityId !== 'string' || !row.entityId.trim()
    || typeof row.buildingName !== 'string' || !row.buildingName.trim()
    || typeof row.attributionName !== 'string' || !row.attributionName.trim()) return undefined;
  return { src: row.src, sourceUrl: row.sourceUrl, entityId: row.entityId,
    buildingName: row.buildingName, attributionName: row.attributionName,
    attributionUrl: httpsUrl(row.attributionUrl) ? row.attributionUrl : null };
}

export function cityPhotoLabel(locale: ContentLocale): string {
  return locale === 'ko' ? '도시 배경 사진' : locale === 'zh-CN' ? '城市背景照片' : 'City context photograph';
}
