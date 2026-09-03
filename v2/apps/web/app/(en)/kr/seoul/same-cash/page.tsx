import type { Metadata } from 'next';
import { SameCashWorkspace } from '@/components/same-cash-workspace';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  sameCashCopy,
  sameCashFooter,
  sameCashHeader,
  sameCashMetadata,
} from '@/lib/same-cash-copy';

export const metadata: Metadata = sameCashMetadata;

export default function SameCashPage() {
  const { hero, why, limits } = sameCashCopy;

  return (
    <div id="top" className="same-cash-page">
      <SiteHeader copy={sameCashHeader} />
      <main>
        <section className="market-hero" aria-label={hero.heading}>
          <div className="site-shell">
            <div className="market-hero__kicker">
              <p className="section-eyebrow">{hero.eyebrow}</p>
            </div>
            <div className="market-hero__statement">
              <h1>{hero.heading}</h1>
            </div>
            <p className="market-hero__description">{hero.description}</p>
            <dl className="same-cash-facts">
              {hero.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.value}</dt>
                  <dd>{fact.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="site-shell">
          <SameCashWorkspace />
        </div>

        <section className="route-section site-shell" aria-label={why.sectionLabel}>
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">{why.eyebrow}</p>
              <h2>{why.heading}</h2>
            </div>
          </div>
          {why.paragraphs.map((paragraph) => (
            <p className="same-cash-prose" key={paragraph.slice(0, 24)}>
              {paragraph}
            </p>
          ))}

          <div className="same-cash-curve">
            <h3>{why.curveHeading}</h3>
            <p>{why.curveDescription}</p>
            <ul>
              {why.curveFindings.map((finding) => (
                <li key={finding.slice(0, 24)}>{finding}</li>
              ))}
            </ul>
            <table className="same-cash-curve__table">
              <caption className="same-cash-curve__caption">{why.curveHeading}</caption>
              <tbody>
                {why.curveRows.map((row) => (
                  <tr key={row.type}>
                    <th scope="row">{row.type}</th>
                    <td>{row.low}</td>
                    <td>{row.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="same-cash-curve__footnote">{why.curveFootnote}</p>
          </div>
        </section>

        <section className="route-section site-shell" aria-label={limits.sectionLabel}>
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">{limits.eyebrow}</p>
              <h2>{limits.heading}</h2>
            </div>
          </div>
          <dl className="same-cash-limits">
            {limits.items.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter copy={sameCashFooter} />
    </div>
  );
}
