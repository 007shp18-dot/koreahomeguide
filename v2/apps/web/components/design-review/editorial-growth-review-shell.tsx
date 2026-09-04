import Link from 'next/link';
import {
  REVIEW_SURFACES,
  type EditorialGrowthReviewModel,
  type ReviewLocale,
  type ReviewSurface,
} from '@/lib/design-review/editorial-growth-review-model';
import { EditorialGrowthContent } from './editorial-growth-content';
import { EditorialGrowthCheck } from './editorial-growth-check';
import { EditorialGrowthExplore } from './editorial-growth-explore';
import { EditorialGrowthHome } from './editorial-growth-home';
import styles from './editorial-growth-review.module.css';

const SURFACE_LABELS: Readonly<Record<ReviewLocale, Readonly<Record<ReviewSurface, string>>>> = Object.freeze({
  en: Object.freeze({ home: 'Home', content: 'Content', check: 'Check', explore: 'Explore' }),
  'zh-CN': Object.freeze({ home: '首页', content: '内容', check: '查价', explore: '探索' }),
});

function reviewHref(
  surface: ReviewSurface,
  model: EditorialGrowthReviewModel,
  locale: ReviewLocale = model.locale,
) {
  const query = new URLSearchParams({
    locale,
    state: model.state,
    ad: model.ad,
  });

  return `/design-review/editorial-growth/${surface}/?${query.toString()}`;
}

function renderReviewSurface(surface: ReviewSurface, model: EditorialGrowthReviewModel) {
  switch (surface) {
    case 'home':
      return <EditorialGrowthHome model={model} />;
    case 'content':
      return <EditorialGrowthContent model={model} />;
    case 'check':
      return <EditorialGrowthCheck model={model} />;
    case 'explore':
      return <EditorialGrowthExplore model={{
        locale: model.locale,
        state: model.state,
        ad: model.ad,
        seoulStatus: model.seoulStatus,
        exploreRows: model.exploreRows,
        exploreDistricts: model.exploreDistricts,
      }} />;
    default: {
      const unreachable: never = surface;
      return unreachable;
    }
  }
}

export function EditorialGrowthReviewShell({
  surface,
  model,
}: Readonly<{
  surface: ReviewSurface;
  model: EditorialGrowthReviewModel;
}>) {
  return (
    <div
      className={styles.reviewRoot}
      data-review-locale={model.locale}
      data-review-surface={surface}
      lang={model.locale}
    >
      <header className={styles.reviewToolbar}>
        <Link className={styles.wordmark} href={reviewHref('home', model)}>
          signed<span>price</span>
        </Link>
        <nav className={styles.surfaceNav} aria-label="Design review surfaces">
          {REVIEW_SURFACES.map((item) => (
            <Link
              aria-current={surface === item ? 'page' : undefined}
              href={reviewHref(item, model)}
              key={item}
            >
              {SURFACE_LABELS[model.locale][item]}
            </Link>
          ))}
        </nav>
        <nav className={styles.languageNav} aria-label="Design review languages">
          <Link aria-current={model.locale === 'en' ? 'page' : undefined} href={reviewHref(surface, model, 'en')}>
            EN
          </Link>
          <Link aria-current={model.locale === 'zh-CN' ? 'page' : undefined} href={reviewHref(surface, model, 'zh-CN')}>
            中文
          </Link>
        </nav>
        <p className={styles.reviewLabel}>Design review · not a public page</p>
      </header>
      {renderReviewSurface(surface, model)}
    </div>
  );
}
