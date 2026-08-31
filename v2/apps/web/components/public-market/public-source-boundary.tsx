import type { PublicSourceBoundaryModel } from '../../lib/public-market/area-route-types';
import styles from './public-market.module.css';

export function PublicSourceBoundary({
  model,
}: Readonly<{ model: PublicSourceBoundaryModel }>) {
  return (
    <section
      className={styles.publicSourceBoundary}
      aria-labelledby="public-source-boundary-heading"
    >
      <div className={styles.publicSourceHeading}>
        <p>Source and limits</p>
        <h2 id="public-source-boundary-heading">Read the evidence with its boundary.</h2>
      </div>
      <dl>
        <div>
          <dt>Registry</dt>
          <dd>{model.provider} reported rental contracts</dd>
        </div>
        <div>
          <dt>Completed period</dt>
          <dd>{model.period || 'Configured period unavailable'}</dd>
        </div>
        <div>
          <dt>Filed area</dt>
          <dd>{model.band}</dd>
        </div>
        <div>
          <dt>Fixed filter</dt>
          <dd>Refundable zero-rent jeonse. Canceled records are excluded.</dd>
        </div>
        <div>
          <dt>Publication rule</dt>
          <dd>Money is not published when n &lt; {model.publicationMinimum}.</dd>
        </div>
        {model.geometryAttribution === undefined ? null : (
          <div>
            <dt>Geometry</dt>
            <dd>{model.geometryAttribution}</dd>
          </div>
        )}
      </dl>
      <p className={styles.publicSourceRights}>{model.attribution.join(', ')}</p>
      <p>
        New and renewal contracts are combined. Unknown contract type and Unknown record status
        are included when the other fixed filters pass.
      </p>
      <p>
        Official reported contracts are not current listings, not an appraisal, and not legal advice.
      </p>
    </section>
  );
}
