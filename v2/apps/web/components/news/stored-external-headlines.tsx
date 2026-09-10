import { loadPublicHeadlines } from '../../lib/news/public-headlines.server';
import type { NewsWorkspaceMarket } from '../../lib/news/news-workspace-model';
import { ExternalHeadlines } from './external-headlines';

export async function StoredExternalHeadlines({ market, preview, locale = 'en' }: Readonly<{
  market: NewsWorkspaceMarket; preview: boolean; locale?: 'en' | 'ko' | 'zh-CN';
}>) {
  const items = await loadPublicHeadlines();
  return <ExternalHeadlines market={market} preview={preview} locale={locale}
    initialModel={items === null ? null : { items, naverState: 'ready' }} />;
}
