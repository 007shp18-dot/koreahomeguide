import Image from 'next/image';

import type { BuildingVisualModel } from '../../lib/public-market/building-visual-model';
import styles from './building-detail.module.css';

export function BuildingVisual({ model }: Readonly<{ model: BuildingVisualModel }>) {
  if (model.kind === 'unavailable') return null;
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
