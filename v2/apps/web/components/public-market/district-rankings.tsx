import Link from 'next/link';

import type {
  PublicAreaRankingsModel,
  PublicDistrictRankingRow,
} from '../../lib/public-market/area-route-types';
import styles from './district-rankings.module.css';
import { PublicSourceBoundary } from './public-source-boundary';

type ReadyModel = Extract<PublicAreaRankingsModel, { status: 'ready' }>;

function RankingRows({
  rows,
}: Readonly<{ rows: readonly PublicDistrictRankingRow[] }>) {
  if (rows.length === 0) {
    return <p className={styles.empty}>No eligible districts for this metric.</p>;
  }
  return (
    <ol className={styles.rows}>
      {rows.map((row) => (
        <li key={row.slug} className={styles.row} data-ranking-row={row.slug}>
          <span className={styles.rank} aria-label={`Rank ${row.rank}`}>{row.rank}</span>
          <Link className={styles.districtLink} href={row.href}>
            <strong>{row.nameEn}</strong>
            <span lang="ko">{row.nameKo}</span>
          </Link>
          <strong className={styles.value}>{row.valueLabel}</strong>
        </li>
      ))}
    </ol>
  );
}

function StandardRanking({
  id,
  eyebrow,
  title,
  definition,
  note,
  rows,
}: Readonly<{
  id: string;
  eyebrow: string;
  title: string;
  definition: string;
  note: string;
  rows: readonly PublicDistrictRankingRow[];
}>) {
  return (
    <section className={styles.panel} aria-labelledby={id} data-ranking-section={id}>
      <header className={styles.panelHeader}>
        <p>{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        <p>{definition}</p>
        <small>{note}</small>
      </header>
      <RankingRows rows={rows} />
    </section>
  );
}

function ChangeRanking({ model }: Readonly<{ model: ReadyModel }>) {
  return (
    <section
      className={styles.panel}
      aria-labelledby="ranking-change-heading"
      data-ranking-section="change"
    >
      <header className={styles.panelHeader}>
        <p>02 / Recent comparison</p>
        <h2 id="ranking-change-heading">Median change: latest 3 months vs prior 3 months</h2>
        <p>Lowest signed comparison first. This describes two completed windows, not a forecast.</p>
        <small>
          {model.changeExcludedDistrictCount} districts excluded because a published median or
          either qualifying three-month window was unavailable.
        </small>
        {model.hasNegativeChange ? null : (
          <strong className={styles.noFall}>No eligible district fell in the latest comparison.</strong>
        )}
      </header>
      {model.change.length === 0 ? (
        <p className={styles.empty}>No eligible districts for this metric.</p>
      ) : (
        <>
          <div className={styles.axisLabels} aria-hidden="true">
            <span>{model.changeAxisLabel.minimum}</span>
            <span>0.0%</span>
            <span>{model.changeAxisLabel.maximum}</span>
          </div>
          <ol className={styles.changeRows}>
            {model.change.map((row) => {
              if (row.bar === null) throw new TypeError('Change ranking requires bar geometry.');
              return (
                <li key={row.slug} className={styles.changeRow} data-ranking-row={row.slug}>
                  <span className={styles.rank} aria-label={`Rank ${row.rank}`}>{row.rank}</span>
                  <Link className={styles.districtLink} href={row.href}>
                    <strong>{row.nameEn}</strong>
                    <span lang="ko">{row.nameKo}</span>
                  </Link>
                  <div className={styles.signedTrack} aria-hidden="true">
                    <span className={styles.centre} data-change-centre="true" />
                    <span
                      className={
                        row.bar.direction === 'positive'
                          ? styles.positive
                          : row.bar.direction === 'negative'
                            ? styles.negative
                            : styles.zero
                      }
                      data-change-direction={row.bar.direction}
                      style={{
                        left: `${row.bar.startPct}%`,
                        width: `${row.bar.extentPct}%`,
                      }}
                    />
                  </div>
                  <strong className={styles.value}>{row.valueLabel}</strong>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}

function ReadyRankings({ model }: Readonly<{ model: ReadyModel }>) {
  return (
    <section className={styles.rankings} aria-labelledby="district-rankings-heading">
      <header className={styles.hero}>
        <p>Seoul · Explore</p>
        <h1 id="district-rankings-heading">Seoul district rankings</h1>
        <p>
          Four comparisons from MOLIT reported zero-rent jeonse contracts, the fixed 45–55㎡
          filed-area band and completed period {model.source.period}. Money appears only when at
          least {model.source.publicationMinimum} contracts qualify.
        </p>
        <p className={styles.exclusion}>
          {model.withheldDistrictCount} districts excluded from monetary rankings because fewer
          than {model.source.publicationMinimum} qualifying contracts were available.
        </p>
      </header>

      <div className={styles.grid}>
        <StandardRanking
          id="ranking-cheapest-heading"
          eyebrow="01 / Lower reported deposits"
          title="Median refundable jeonse deposit"
          definition="Lowest filed median first for the displayed fixed filter. This is not a ranking of cheapest homes or affordability."
          note="Published district summaries only."
          rows={model.cheapest}
        />
        <ChangeRanking model={model} />
        <StandardRanking
          id="ranking-spread-heading"
          eyebrow="03 / Central dispersion"
          title="Middle-half spread (P75 − P25)"
          definition="Widest central-half deposit spread first. This is dispersion, not volatility, risk or negotiation room."
          note="Calculated from raw P75 minus P25, not the full range."
          rows={model.spread}
        />
        <StandardRanking
          id="ranking-sample-heading"
          eyebrow="04 / Evidence depth"
          title="Qualifying reported contracts"
          definition="Deepest qualifying sample first. Count is evidence depth under this filter, not market size, demand, liquidity or quality."
          note="Counts are qualifying reported contracts in the completed period."
          rows={model.sample}
        />
      </div>

      <aside className={styles.limit} aria-label="Ranking limitations">
        <p>
          These ranks compare only the displayed fixed filter. They do not rank neighbourhoods,
          individual homes, legal safety, condition, transit, schools or future price movement.
        </p>
      </aside>
      <PublicSourceBoundary model={model.source} />
    </section>
  );
}

function UnavailableRankings({
  model,
}: Readonly<{ model: Extract<PublicAreaRankingsModel, { status: 'unavailable' }> }>) {
  return (
    <section className={styles.rankings} aria-labelledby="rankings-unavailable-heading">
      <header className={styles.hero}>
        <p>Seoul · Explore</p>
        <h1 id="rankings-unavailable-heading">{model.message}</h1>
        <p>The verified district artifact failed closed. No district money is substituted.</p>
      </header>
      <div className={styles.unavailable}>
        <p>Verified evidence is required before a district ranking can publish figures.</p>
        <Link href="/kr/seoul/explore/">Return to District Explorer</Link>
      </div>
      <PublicSourceBoundary model={model.source} />
    </section>
  );
}

export function DistrictRankings({ model }: Readonly<{ model: PublicAreaRankingsModel }>) {
  return model.status === 'ready'
    ? <ReadyRankings model={model} />
    : <UnavailableRankings model={model} />;
}
