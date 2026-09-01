import Link from 'next/link';

import { BrandWordmark } from '../brand-mark';
import styles from './building-detail.module.css';

export function BuildingDetailHeader() {
  return (
    <header className={styles.compactHeader}>
      <Link href="/" aria-label="signedprice home"><BrandWordmark /></Link>
      <nav aria-label="Building detail market navigation">
        <Link href="/kr/seoul/" aria-current="location">Seoul</Link>
        <Link href="/sg/singapore/explore/">Singapore</Link>
        <span aria-disabled="true">Dubai</span>
      </nav>
      <span className={styles.currentProduct}>Explore</span>
    </header>
  );
}
