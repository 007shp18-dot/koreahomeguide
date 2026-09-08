import { unstable_cache } from 'next/cache';
import { loadPersistedNewsItems } from '../../lib/news/news-persistence.server';
import { ExternalHeadlines } from './external-headlines';

const storedHeadlines = unstable_cache(
  () => loadPersistedNewsItems(1500), ['reviewed-external-headline-preview-v2'], { revalidate: 60 },
);

export async function StoredExternalHeadlines({ market, preview }: Readonly<{
  market: 'all' | 'seoul' | 'singapore' | 'dubai'; preview: boolean;
}>) {
  const stored = await storedHeadlines();
  const items = stored?.filter((item) => market === 'all' || item.market === market)
    .slice(0, preview ? 4 : 24);
  return <ExternalHeadlines market={market} preview={preview}
    initialModel={items?.length ? { items, naverState: 'ready' } : null} />;
}
