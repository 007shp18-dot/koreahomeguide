import type { TrustStripModel } from '../lib/site-copy';

type TrustStripProps = {
  copy: TrustStripModel;
};

export function TrustStrip({ copy }: TrustStripProps) {
  return (
    <section
      className="trust-strip"
      id="methodology"
      aria-label={copy.sectionLabel}
    >
      <div className="trust-strip__intro">
        <p className="section-eyebrow">{copy.eyebrow}</p>
        <h2>{copy.heading}</h2>
        <p>{copy.description}</p>
      </div>
      <dl className="trust-strip__facts">
        {copy.items.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
