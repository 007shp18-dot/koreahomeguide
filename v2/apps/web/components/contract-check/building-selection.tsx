import Link from 'next/link';
import { buildingDisplayName } from '../../lib/public-market/seoul-display-names';
import styles from './contract-check.module.css';

export function BuildingSelection({ id, name, locale }: Readonly<{
  id: string | null; name: string | null; locale: 'en' | 'ko' | 'zh-CN';
}>) {
  const selected = id !== null && name !== null;
  return <div className={styles.field}>
    <label><span>{locale === 'ko' ? '비교할 단지' : locale === 'zh-CN' ? "比较楼宇" : 'Building to compare'}</span>
      <select name="building" defaultValue={selected ? id : ''}>
        <option value="">{locale === 'ko' ? '선택한 자치구의 거래' : locale === 'zh-CN' ? "所选行政区的成交" : 'Transactions across the selected district'}</option>
        {selected ? <option value={id}>{buildingDisplayName(name, locale)}</option> : null}
      </select>
    </label>
    <Link href={`${locale === 'zh-CN' ? '/zh-cn' : locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{locale === 'ko' ? '단지 이름으로 찾아 선택하기' : locale === 'zh-CN' ? "在探索中查找并选择楼宇" : 'Find and select a building in Explore'}</Link>
  </div>;
}
