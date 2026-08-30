import type { CapabilityGridModel } from '../lib/route-model';

export interface CapabilityGridProps {
  readonly model: CapabilityGridModel;
}

export function CapabilityGrid({ model }: CapabilityGridProps) {
  const headingId = `${model.sectionLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-heading`;

  return (
    <section className="route-section site-shell" aria-labelledby={headingId}>
      <div className="route-section__heading">
        <div>
          <p className="section-eyebrow">{model.eyebrow}</p>
          <h2 id={headingId}>{model.heading}</h2>
        </div>
        <p>{model.description}</p>
      </div>
      <div className="capability-grid">
        {model.items.map((item) => {
          const content = (
            <>
              <div className="capability-card__status-row">
                <h3>{item.label}</h3>
                <span className={`market-status market-status--${item.state}`}>
                  {item.stateLabel}
                </span>
              </div>
              <p>{item.description}</p>
            </>
          );

          return (
            <article className="capability-card" key={`${item.label}-${item.state}`}>
              {item.href ? (
                <a className="capability-card__link" href={item.href}>
                  {content}
                </a>
              ) : (
                <div className="capability-card__body">{content}</div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
