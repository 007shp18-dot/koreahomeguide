'use client';

import { useId, useState, type CSSProperties } from 'react';
import type { SiteLocale } from '../../lib/navigation/site-navigation';
import styles from './budget-house-scene.module.css';

const COPY = {
  en: { view: 'House view', left: 'Left', front: 'Front', right: 'Right', category: 'Cost category', price: 'Purchase price', fees: 'Buying costs', ongoing: 'Ongoing costs', note: 'Illustrative model; shapes do not represent cost amounts.', descriptions: { price: 'The property price is the starting point for your budget.', fees: 'Check applicable taxes and transaction fees separately from the property price.', ongoing: 'Plan for recurring costs such as maintenance, insurance and financing, where applicable.' } },
  ko: { view: '집 보기 방향', left: '왼쪽', front: '정면', right: '오른쪽', category: '비용 항목', price: '집값', fees: '취득비용', ongoing: '보유비용', note: '이해를 돕는 모형이며, 형태의 크기는 비용을 나타내지 않습니다.', descriptions: { price: '매입 가격은 예산 계산의 출발점입니다.', fees: '집값과 별도로 적용되는 세금과 거래 수수료를 확인하세요.', ongoing: '유지·보수, 보험, 대출 등 내 조건에 해당하는 반복 비용을 살펴보세요.' } },
  'zh-CN': { view: '房屋视角', left: '左侧', front: '正面', right: '右侧', category: '成本类别', price: '购房价格', fees: '购置费用', ongoing: '持有费用', note: '示意模型，形状大小不代表费用金额。', descriptions: { price: '房产价格是预算计算的起点。', fees: '除房价外，另行确认适用的税费与交易手续费。', ongoing: '考虑适用于自身情况的维护、保险和融资等持续费用。' } },
} as const;
type Cost = 'price' | 'fees' | 'ongoing';
type View = 'left' | 'front' | 'right';

function Block({ kind, width, height, depth, x = 0, y = 0, z = 0, windows = false }: Readonly<{ kind: string; width: number; height: number; depth: number; x?: number; y?: number; z?: number; windows?: boolean }>) {
  const dimensions = { '--w': `${width}px`, '--h': `${height}px`, '--d': `${depth}px`, '--x': `${x}px`, '--y': `${y}px`, '--z': `${z}px` } as CSSProperties;
  return <div className={`${styles.block} ${styles[kind]}`} style={dimensions}>
    <div className={`${styles.face} ${styles.front}`}>{windows && <><span className={styles.windows} /><span className={styles.door} /></>}</div>
    <div className={`${styles.face} ${styles.back}`} />
    <div className={`${styles.face} ${styles.left}`}>{windows && <span className={styles.sideWindows} />}</div>
    <div className={`${styles.face} ${styles.right}`}>{windows && <span className={styles.sideWindows} />}</div>
    <div className={`${styles.face} ${styles.top}`} />
    <div className={`${styles.face} ${styles.bottom}`} />
  </div>;
}

export function BudgetHouseScene({ locale }: Readonly<{ locale: SiteLocale }>) {
  const [view, setView] = useState<View>('right');
  const [cost, setCost] = useState<Cost>('price');
  const descriptionId = useId();
  const copy = COPY[locale];
  return <div className={styles.scene} data-budget-house="interactive" data-view={view} data-cost={cost}>
    <div className={styles.viewport} aria-hidden="true">
      <div className={styles.model}>
        <Block kind="plinth" width={180} height={12} depth={140} y={58} />
        <Block kind="building" width={110} height={78} depth={86} x={-10} y={13} windows />
        <Block kind="roof" width={122} height={8} depth={98} x={-10} y={-30} />
        <Block kind="annex" width={36} height={48} depth={62} x={63} y={28} z={-5} windows />
        <Block kind="roof" width={42} height={6} depth={68} x={63} y={1} z={-5} />
        <Block kind="step" width={36} height={5} depth={24} x={-10} y={50} z={52} />
      </div>
    </div>
    <div className={styles.views} role="group" aria-label={copy.view}>
      {(['left', 'front', 'right'] as const).map(direction => <button type="button" key={direction} onClick={() => setView(direction)} aria-pressed={view === direction}>{copy[direction]}</button>)}
    </div>
    <label className={styles.category}><span>{copy.category}</span><select aria-label={copy.category} aria-describedby={descriptionId} value={cost} onChange={event => setCost(event.target.value as Cost)}>
      {(['price', 'fees', 'ongoing'] as const).map(category => <option key={category} value={category}>{copy[category]}</option>)}
    </select></label>
    <p id={descriptionId} className={styles.description} aria-live="polite">{copy.descriptions[cost]}</p>
    <small className={styles.note}>{copy.note}</small>
  </div>;
}
