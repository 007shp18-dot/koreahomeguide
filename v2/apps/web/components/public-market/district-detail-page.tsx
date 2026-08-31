import { getPublicMarketConfig } from '@signedprice/market-core';
import Link from 'next/link';

import type { PublicDistrictModel } from '../../lib/public-market/area-route-types';
import type { SiteFooterModel, SiteHeaderModel } from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { BoxPlot } from './box-plot';
import styles from './district-detail.module.css';
import { QuoteInput } from './quote-input';
import { SampleChip } from './sample-chip';
import { PublicSectionTabs } from './public-section-tabs';
import { PublicSourceBoundary } from './public-source-boundary';

const config = getPublicMarketConfig('kr-seoul');
const money = new Intl.NumberFormat(config.formatLocale, {
  style: 'currency',
  currency: config.currencyCode,
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

function headerFor(model: PublicDistrictModel): SiteHeaderModel {
  return {
    brand: 'signedprice',
    homeLabel: 'signedprice home',
    navigationLabel: `${model.identity.nameEn} evidence navigation`,
    links: [
      { label: 'Global home', href: '/' },
      { label: 'Seoul market', href: '/kr/seoul/' },
      { label: 'District Explorer', href: '/kr/seoul/explore/' },
    ],
  };
}

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul jeonse-deposit evidence, with publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'District Explorer', href: '/kr/seoul/explore/' },
  ],
  status: 'Korea public P2 preview. Production launch is not authorized.',
};

function safeJson(value: Readonly<Record<string, unknown>>): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function DistrictNavigation({ model }: Readonly<{ model: PublicDistrictModel }>) {
  const exploreHref = `/kr/seoul/explore/?district=${model.identity.slug}`;
  return (
    <nav className={styles.navigation} aria-label="District evidence navigation">
      <Link className={styles.exploreLink} href={exploreHref}>
        Return to Explore with {model.identity.nameEn} selected
      </Link>
      <div className={styles.nearby}>
        <p>Nearby districts</p>
        {model.nearby.map((district) => (
          <Link href={`/kr/seoul/${district.slug}/`} key={district.slug}>
            <strong>{district.nameEn}</strong>
            <span lang="ko">{district.nameKo}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Faq({ model }: Readonly<{
  model: Extract<PublicDistrictModel, { status: 'published' | 'withheld' }>;
}>) {
  return (
    <section className={styles.faq} aria-labelledby="district-faq-heading">
      <div className={styles.sectionHeading}>
        <p>03 / Computed FAQ</p>
        <h2 id="district-faq-heading">Questions answered from this district summary.</h2>
      </div>
      <div className={styles.faqGrid}>
        {model.faq.map(({ question, answer }) => (
          <article key={question}>
            <h3>{question}</h3>
            <p>{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Finding({ model }: Readonly<{ model: PublicDistrictModel }>) {
  if (model.status === 'unavailable') {
    return (
      <header className={styles.hero}>
        <p>Seoul · {model.identity.nameKo}</p>
        <h1>{model.message} for {model.identity.nameEn}.</h1>
        <p>No city figure is substituted for unavailable district evidence.</p>
      </header>
    );
  }
  const finding = model.status === 'published' ? model.display.medianLabel : 'Not published';
  return (
    <header className={styles.hero}>
      <p>Seoul · <span lang="ko">{model.identity.nameKo}</span></p>
      <h1>{model.identity.nameEn}: {finding} from {model.display.sampleLabel}.</h1>
      <SampleChip label={model.display.sampleLabel} state={model.status} />
    </header>
  );
}

function Evidence({ model }: Readonly<{ model: PublicDistrictModel }>) {
  if (model.status === 'unavailable') {
    return (
      <section className={styles.unavailable} aria-label="District evidence unavailable">
        <p>Verified district evidence is required before any monetary finding can be shown.</p>
      </section>
    );
  }
  return (
    <section className={styles.evidence} aria-labelledby="district-evidence-heading">
      <div className={styles.sectionHeading}>
        <p>01 / District finding</p>
        <h2 id="district-evidence-heading">
          {model.status === 'published' ? 'Published distribution' : 'Distribution not published'}
        </h2>
      </div>
      {model.status === 'published' ? (
        <>
          <dl className={styles.findingGrid}>
            <div><dt>Median</dt><dd>{model.display.medianLabel}</dd></div>
            <div><dt>Middle half</dt><dd>{model.display.middleHalfLabel}</dd></div>
            <div><dt>Full range</dt><dd>{model.display.rangeLabel}</dd></div>
            <div><dt>Recent change</dt><dd>{model.display.changeLabel}</dd></div>
          </dl>
          <div className={styles.quoteBlock}>
            <div className={styles.sectionHeading}>
              <p>02 / Local quote</p>
              <h2>Compare one refundable deposit locally.</h2>
            </div>
            <QuoteInput
              config={config}
              summary={model.summary}
              areaLabel={`${model.identity.nameEn} (${model.identity.nameKo})`}
              showMedianFaq
            />
          </div>
        </>
      ) : (
        <BoxPlot
          summary={model.summary}
          axis={config.axis}
          formatValue={(value) => money.format(value)}
        />
      )}
    </section>
  );
}

export function DistrictDetailPage({ model }: Readonly<{ model: PublicDistrictModel }>) {
  return (
    <div id="top" className={styles.page} data-district-detail={model.status}>
      <SiteHeader copy={headerFor(model)} />
      <PublicSectionTabs current="explore" />
      <main className={styles.main}>
        <Finding model={model} />
        <Evidence model={model} />
        {model.status === 'unavailable' ? null : <Faq model={model} />}
        <PublicSourceBoundary model={model.source} />
        <DistrictNavigation model={model} />
      </main>
      {model.status === 'unavailable' ? null : (
        <>
          <script
            type="application/ld+json"
            data-structured-data="dataset"
            dangerouslySetInnerHTML={{ __html: safeJson(model.datasetJsonLd) }}
          />
          <script
            type="application/ld+json"
            data-structured-data="faq"
            dangerouslySetInnerHTML={{ __html: safeJson(model.faqJsonLd) }}
          />
        </>
      )}
      <SiteFooter copy={footer} />
    </div>
  );
}
