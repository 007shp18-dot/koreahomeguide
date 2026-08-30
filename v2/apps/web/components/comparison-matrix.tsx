import type { ComparisonMatrixModel } from '../lib/route-model';

export interface ComparisonMatrixProps {
  readonly model: ComparisonMatrixModel;
}

export function ComparisonMatrix({ model }: ComparisonMatrixProps) {
  const headingId = 'comparison-matrix-heading';

  return (
    <section className="route-section site-shell" aria-labelledby={headingId}>
      <div className="route-section__heading">
        <div>
          <p className="section-eyebrow">{model.eyebrow}</p>
          <h2 id={headingId}>{model.heading}</h2>
        </div>
        <div className="comparison-matrix__intro">
          <p>{model.description}</p>
          <p>{model.sectorBoundary}</p>
        </div>
      </div>
      <div
        className="comparison-matrix__scroll"
        role="region"
        aria-label={model.tableLabel}
        tabIndex={0}
      >
        <table className="comparison-matrix">
          <caption>{model.tableLabel}</caption>
          <thead>
            <tr>
              <th scope="col">{model.rowHeaderLabel}</th>
              {model.columns.map((column) => (
                <th scope="col" key={column.marketId}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {model.columns.map((column) => {
                  const cell = row.cells.find(
                    (candidate) => candidate.marketId === column.marketId,
                  );

                  if (!cell) return null;

                  return (
                    <td key={cell.marketId}>
                      <span className={`market-status market-status--${cell.state}`}>
                        {cell.stateLabel}
                      </span>
                      <p>{cell.description}</p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
