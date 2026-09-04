import { HomeMarketBrowser } from '@/components/home-market-browser';
import { HomeEditorialSections } from '@/components/home-editorial-sections';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  buildHomepagePresentation,
  homepageCopy,
} from '@/lib/site-copy';
import type { Metadata } from 'next';
import { buildSingaporeEntryModel } from '@/lib/singapore/route-model.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';
import { buildSeoulLiveModel } from '@/lib/public-market/seoul-live-model.server';
import { buildNewsIndexModel } from '@/lib/news/news-route-model.server';
import { buildHomeMarketVisuals } from '@/lib/home-market-visuals.server';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';

export const metadata: Metadata = homepageCopy.metadata;

export default async function Home() {
  const singaporeRepository = await singaporeSnapshotRepositoryFromEnvironment();
  const presentation = buildHomepagePresentation(buildSingaporeEntryModel(singaporeRepository));
  const seoul = buildSeoulLiveModel();
  const news = buildNewsIndexModel();
  const featuredBuildings = buildHomeMarketVisuals();
  const naverMapClientId = process.env.NAVER_MAP_CLIENT_ID?.trim() || null;
  const googleMapsBrowserKey = googleMapsBrowserKeyFromEnvironment();
  const copy = presentation.copy;
  return (
    <div id="top">
      <SiteHeader copy={copy.header} />
      <main>
        <HomeMarketBrowser
          copy={copy}
          markets={presentation.markets}
          seoul={seoul}
          featuredBuildings={featuredBuildings}
          naverMapClientId={naverMapClientId}
          googleMapsBrowserKey={googleMapsBrowserKey}
        />
        <HomeEditorialSections
          seoul={seoul}
          news={news}
          featuredBuildings={featuredBuildings}
          naverMapClientId={naverMapClientId}
          googleMapsBrowserKey={googleMapsBrowserKey}
          markets={presentation.markets}
        />
      </main>
      <SiteFooter copy={copy.footer} />
    </div>
  );
}
