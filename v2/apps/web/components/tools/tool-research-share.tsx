'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { recordToolCompletion } from '../../lib/tool-research/aggregate-client';

import {
  deleteToolResearch,
  type ToolResearchLocale,
} from '../../lib/tool-research/client';
import type { NormalizedToolResearchSnapshot } from '../../lib/tool-research/contract';
import styles from './tool-research-share.module.css';

const COPY = {
  en: {
    privacy: 'SignedPrice assigns this browser a pseudonymous ownership cookie. Your contribution is used for product research and expires automatically after 90 days. Clearing the cookie removes this browser’s ability to manage earlier contributions; they still expire automatically.',
    delete: 'Delete this browser’s contributions', deleting: 'Deleting…', deleted: (count: number) => `${count} contribution${count === 1 ? '' : 's'} deleted.`, none: 'No contributions owned by this browser were found.', deleteError: 'Contributions could not be deleted. Nothing has been reported as deleted.',
  },
  ko: {
    privacy: 'SignedPrice는 이 브라우저에서 제공한 자료를 구분하는 쿠키를 사용합니다. 기여 자료는 제품 연구에 사용되며 90일 뒤 자동 삭제됩니다. 쿠키를 지우면 이전 자료를 직접 삭제할 수 없으며, 자료는 예정대로 90일 뒤 자동 삭제됩니다.',
    delete: '이 브라우저의 기여 자료 삭제', deleting: '삭제 중…', deleted: (count: number) => `기여 자료 ${count}건을 삭제했습니다.`, none: '이 브라우저가 소유한 기여 자료가 없습니다.', deleteError: '기여 자료를 삭제하지 못했습니다. 삭제되었다고 처리하지 않았습니다.',
  },
  'zh-CN': {
    privacy: 'SignedPrice 会为此浏览器分配一个化名所有权 Cookie。提交内容仅用于产品研究，并在 90 天后自动到期。清除该 Cookie 后，此浏览器将无法管理之前的提交内容；这些内容仍会自动到期。',
    delete: '删除此浏览器的提交内容', deleting: '正在删除…', deleted: (count: number) => `已删除 ${count} 条提交内容。`, none: '未找到此浏览器拥有的提交内容。', deleteError: '无法删除提交内容。系统未将其显示为已删除。',
  },
} as const;

type DeleteState = Readonly<{ state: 'idle' | 'deleting' | 'error' }>
  | Readonly<{ state: 'deleted'; count: number }>;

function ToolResearchDeleteControl({ locale, onDeleted, disabled = false }: Readonly<{
  locale: ToolResearchLocale;
  onDeleted?: () => void;
  disabled?: boolean;
}>) {
  const copy = COPY[locale];
  const [state, setState] = useState<DeleteState>({ state: 'idle' });
  const run = async () => {
    if (disabled || state.state === 'deleting') return;
    setState({ state: 'deleting' });
    try {
      const result = await deleteToolResearch();
      setState({ state: 'deleted', count: result.deletedCount });
      onDeleted?.();
    } catch {
      setState({ state: 'error' });
    }
  };
  const message = state.state === 'deleted'
    ? state.count === 0 ? copy.none : copy.deleted(state.count)
    : state.state === 'error' ? copy.deleteError : null;
  return <div className={styles.actions}>
    <button type="button" disabled={disabled || state.state === 'deleting'} onClick={run}>
      {state.state === 'deleting' ? copy.deleting : copy.delete}
    </button>
    {message === null ? null : <p className={styles.status} role="status">{message}</p>}
  </div>;
}

/** Counts only allowlisted tool/market categories; never sends the research snapshot. */
export function ToolResearchShare({ snapshot, resultRevision, locale = 'en' }: Readonly<{
  snapshot: NormalizedToolResearchSnapshot | null;
  resultRevision: string | number;
  locale?: ToolResearchLocale;
  label?: string;
}>) {
  const lastResult = useRef<string | null>(null);
  const tool = snapshot?.tool;
  const market = snapshot?.market;
  useEffect(() => {
    if (!tool || !market) return;
    const key = `${tool}:${market}:${resultRevision}`;
    if (lastResult.current === key) return;
    lastResult.current = key;
    void recordToolCompletion({ tool, market });
  }, [tool, market, resultRevision]);
  if (snapshot === null) return null;
  const notice = locale === 'ko'
    ? '도구·도시별 이용 횟수만 집계합니다. 입력값과 개인 식별자는 저장하지 않습니다.'
    : locale === 'zh-CN'
      ? '仅汇总工具和城市的使用次数，不保存输入值或个人标识符。'
      : 'We count tool usage by city, without storing your inputs or personal identifiers.';
  return <p className={styles.privacy}>{notice} <Link href="/privacy/">{locale === 'ko' ? '개인정보 설정' : locale === 'zh-CN' ? '隐私选项' : 'Privacy choices'}</Link></p>;
}

export function ToolResearchDelete({ locale = 'en' }: Readonly<{ locale?: ToolResearchLocale }>) {
  const copy = COPY[locale];
  return <div className={styles.deleteStandalone}>
    <p className={styles.privacy}>{copy.privacy}</p>
    <ToolResearchDeleteControl locale={locale} />
  </div>;
}

export function ToolResearchManagement({ locale = 'en' }: Readonly<{ locale?: ToolResearchLocale }>) {
  const heading = locale === 'ko' ? '연구 기여 자료 관리'
    : locale === 'zh-CN' ? '管理研究提交内容' : 'Manage research contributions';
  const description = locale === 'ko' ? '이 브라우저에서 선택적으로 공유한 구간 자료를 삭제할 수 있습니다.'
    : locale === 'zh-CN' ? '删除从此浏览器选择共享的区间数据。'
      : 'Delete broad-band scenarios that you chose to share from this browser.';
  return <details className={styles.management} data-tool-research-management="true">
    <summary>{heading}</summary>
    <div className={styles.managementBody}>
      <p className={styles.intro}>{description}</p>
      <ToolResearchDelete locale={locale} />
    </div>
  </details>;
}
