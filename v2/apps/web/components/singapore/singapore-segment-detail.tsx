
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import Link from 'next/link';

import type {
  SingaporeSegmentModel,
  SingaporeUnavailableModel,
} from '../../lib/singapore/route-types';
import {
  SingaporeEvidence,
  SingaporePage,
  SingaporeScope,
  singaporeStyles as styles,
} from './singapore-shell';
import { MarketDetailShell } from '../market-ui/market-shell';

function PriceRange({ locale = 'en', value }: Readonly<{ locale?: MarketLocale; value: string }>) {
  const separator = value.indexOf('–');
  if (separator < 0) return value;
  return <>{sgText(locale, value.slice(0, separator + 1))}<wbr />{sgText(locale, value.slice(separator + 1))}</>;
}
import { EvidencePendingLink } from './evidence-pending-link';

export function SingaporeSegmentDetail({ locale = 'en', model }: Readonly<{ locale?: MarketLocale;
  model: SingaporeSegmentModel | SingaporeUnavailableModel;
}>) {
  if (model.status === 'unavailable') return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")}>
      <section className={styles.unavailable} data-singapore-segment="unavailable" data-product-intro="true">
        <h1>{sgText(locale, model.message)}</h1>
        <p>{sgText(locale, "No segment value is substituted.")}</p>
        <div className={styles.actions}>
          <Link href={marketHref(locale, "/sg/singapore/explore/")}>{sgText(locale, "Return to Explore")}</Link>
          <Link href={marketHref(locale, model.correctionHref)}>{sgText(locale, "Review corrections")}</Link>
        </div>
      </section>
    </SingaporePage>
  );
  if (model.status === 'insufficient') return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")}>
      <section className={styles.withheld} data-singapore-segment="insufficient" data-product-intro="true">
        <p className={styles.eyebrow}>{sgText(locale, "Singapore · ")}{sgText(locale, model.identity.segment)}</p>
        <h1>{sgText(locale, "Distribution not published.")}</h1>
        <p>{sgText(locale, model.count)}{sgText(locale, " reported transactions. At least ")}{sgText(locale, model.threshold)}{sgText(locale, " are required.")}</p>
        <p>{sgText(locale, "No monetary value is substituted for sparse evidence.")}</p>
      </section>
      <SingaporeEvidence locale={locale} model={model.evidence} />
    </SingaporePage>
  );
  return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")} unframed>
      <MarketDetailShell locale={locale}
        breadcrumb={<nav className={styles.breadcrumbs} aria-label={sgText(locale, "Breadcrumb")}><Link href={marketHref(locale, "/sg/singapore/explore/")}>{sgText(locale, "Explore")}</Link><span>{sgText(locale, model.identity.segment)}</span></nav>}
        identity={<div className={styles.detailIdentity} data-singapore-segment="ready"><p className={styles.eyebrow}>{sgText(locale, "Singapore · Market segment")}</p><h1>{sgText(locale, model.identity.segment)}</h1><SingaporeScope locale={locale} activeSegment={model.identity.segment} /></div>}
        metric={<div className={styles.detailMetric}><small>{sgText(locale, "Median price")}</small><strong>{sgText(locale, model.display.medianPriceLabel)}</strong><span>{sgText(locale, model.display.sampleLabel)}</span></div>}
        evidence={<><section className={styles.section} aria-labelledby="segment-distribution-heading">
        <p className={styles.sectionLabel}>{sgText(locale, "01 / Published distribution")}</p>
        <h2 id="segment-distribution-heading">{sgText(locale, "Raw transaction evidence.")}</h2>
        <dl className={styles.stats}>
          <div className={styles.stat}><dt>{sgText(locale, "Median price")}</dt><dd>{sgText(locale, model.display.medianPriceLabel)}</dd></div>
          <div className={styles.stat}><dt>{sgText(locale, "Middle half")}</dt><dd><PriceRange locale={locale} value={model.display.middlePriceLabel} /></dd></div>
          <div className={styles.stat}><dt>{sgText(locale, "Median unit price")}</dt><dd>{sgText(locale, model.display.medianPsfLabel)}</dd></div>
        </dl>
      </section><section className={styles.section} aria-labelledby="project-list-heading">
        <p className={styles.sectionLabel}>{sgText(locale, "02 / Projects")}</p>
        <h2 id="project-list-heading">{sgText(locale, "Projects in ")}{sgText(locale, model.identity.segment)}{sgText(locale, ".")}</h2>
        <div className={styles.projectGrid}>
          {model.projects.map((project) => (
            <article className={styles.projectCard} key={project.id}>
              <h3>{project.name}</h3><p>{project.street}{sgText(locale, " · District ")}{sgText(locale, project.district)}</p>
              <p>{sgText(locale, project.n)}{sgText(locale, " reported transactions")}</p>
              <p>{sgText(locale, project.medianPriceLabel ?? 'Distribution not published')}</p>
              <p>{sgText(locale, project.medianPsfLabel ?? 'PSF not published')}</p>
              {project.state === 'published'
                ? <EvidencePendingLink locale={locale} href={marketHref(locale, project.href)}>{sgText(locale, "Open project evidence")}</EvidencePendingLink>
                : <span className={styles.evidenceUnavailableLink} data-evidence-link="unavailable" aria-disabled="true">{sgText(locale, "At least 5 transactions are required")}</span>}
            </article>
          ))}
        </div>
      </section></>}
        rail={<SingaporeEvidence locale={locale} model={model.evidence} />}
      />
    </SingaporePage>
  );
}
