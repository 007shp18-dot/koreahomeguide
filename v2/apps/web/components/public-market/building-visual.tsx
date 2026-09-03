import Image from 'next/image';
import Link from 'next/link';

import type { BuildingVisualModel } from '../../lib/public-market/building-visual-model';
import styles from './building-detail.module.css';

export function BuildingVisual({ model }: Readonly<{ model: BuildingVisualModel }>) {
  if (model.kind === 'unavailable') {
    return (
      <section
        className={styles.visualUnavailable}
        aria-label={model.title}
        data-building-media="evidence-fallback"
      >
        <div className={styles.visualEvidenceMark} aria-hidden="true">
          <span>Reported</span>
          <span>Verified</span>
          <span>Boundary shown</span>
        </div>
        <div className={styles.visualUnavailableCopy}>
          <small>Evidence view · no licensed photo</small>
          <strong>{model.title}</strong>
          <p>{model.reason}</p>
          <Link href={model.nextAction.href}>{model.nextAction.label}</Link>
        </div>
      </section>
    );
  }
  return (
    <figure className={styles.visualPhoto} data-building-media="licensed-photo">
      <Image
        src={model.src}
        alt={model.alt}
        fill
        sizes="(max-width: 720px) 100vw, 54vw"
      />
      <figcaption>{model.sourceLabel}</figcaption>
    </figure>
  );
}
