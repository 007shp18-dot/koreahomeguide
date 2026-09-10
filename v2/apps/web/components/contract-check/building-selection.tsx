import Link from 'next/link';
import { buildingDisplayName } from '../../lib/public-market/seoul-display-names';
import styles from './contract-check.module.css';

export function BuildingSelection({ id, name, locale }: Readonly<{
  id: string | null; name: string | null; locale: 'en' | 'ko';
}>) {
  const selected = id !== null && name !== null;
  return <div className={styles.field}>
    <label><span>{locale === 'ko' ? '비교할 단지' : 'Building to compare'}</span>
      <select name="building" defaultValue={selected ? id : ''}>
        <option value="">{locale === 'ko' ? '선택한 자치구의 거래' : 'Transactions across the selected district'}</option>
        {selected ? <option value={id}>{buildingDisplayName(name, locale)}</option> : null}
      </select>
    </label>
    <Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{locale === 'ko' ? '단지 이름으로 찾아 선택하기' : 'Find and select a building in Explore'}</Link>
  </div>;
}
