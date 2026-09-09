'use client';

import { useRef, useState } from 'react';

import {
  deleteToolResearch,
  submitToolResearch,
  toolResearchPanelKey,
  toolResearchPreview,
  type ToolResearchLocale,
} from '../../lib/tool-research/client';
import type { NormalizedToolResearchSnapshot } from '../../lib/tool-research/contract';
import styles from './tool-research-share.module.css';

const COPY = {
  en: {
    summary: 'Help improve this tool',
    intro: 'Optionally share these broad bands for product research. Exact prices, addresses, building or project IDs, links, and personal details are not sent.',
    privacy: 'SignedPrice assigns this browser a pseudonymous ownership cookie. Your contribution is used for product research and expires automatically after 90 days. Clearing the cookie removes this browser’s ability to manage earlier contributions; they still expire automatically.',
    consent: 'I consent to sharing the bands and categories shown above for product research.',
    submit: 'Share these bands', saving: 'Sharing…', saved: 'Contribution saved.', duplicate: 'This contribution was already saved.', error: 'The contribution could not be saved. Your result is unchanged.', retry: 'Retry sharing',
    delete: 'Delete this browser’s contributions', deleting: 'Deleting…', deleted: (count: number) => `${count} contribution${count === 1 ? '' : 's'} deleted.`, none: 'No contributions owned by this browser were found.', deleteError: 'Contributions could not be deleted. Nothing has been reported as deleted.',
  },
  ko: {
    summary: '도구 개선에 참여하기',
    intro: '제품 연구를 위해 아래의 넓은 구간만 선택적으로 공유할 수 있습니다. 정확한 가격, 주소, 단지·프로젝트 ID, 링크, 개인 정보는 전송하지 않습니다.',
    privacy: 'SignedPrice는 이 브라우저에서 제공한 자료를 구분하는 쿠키를 사용합니다. 기여 자료는 제품 연구에 사용되며 90일 뒤 자동 삭제됩니다. 쿠키를 지우면 이전 자료를 직접 삭제할 수 없으며, 자료는 예정대로 90일 뒤 자동 삭제됩니다.',
    consent: '위에 표시된 구간과 범주를 제품 연구 목적으로 공유하는 데 동의합니다.',
    submit: '이 구간 공유', saving: '공유 중…', saved: '기여 자료를 저장했습니다.', duplicate: '이 기여 자료는 이미 저장되어 있습니다.', error: '기여 자료를 저장하지 못했습니다. 계산 결과에는 영향이 없습니다.', retry: '다시 공유',
    delete: '이 브라우저의 기여 자료 삭제', deleting: '삭제 중…', deleted: (count: number) => `기여 자료 ${count}건을 삭제했습니다.`, none: '이 브라우저가 소유한 기여 자료가 없습니다.', deleteError: '기여 자료를 삭제하지 못했습니다. 삭제되었다고 처리하지 않았습니다.',
  },
  'zh-CN': {
    summary: '帮助改进此工具',
    intro: '您可以选择仅为产品研究共享以下宽泛区间。不会发送确切价格、地址、楼盘或项目 ID、链接及个人资料。',
    privacy: 'SignedPrice 会为此浏览器分配一个化名所有权 Cookie。提交内容仅用于产品研究，并在 90 天后自动到期。清除该 Cookie 后，此浏览器将无法管理之前的提交内容；这些内容仍会自动到期。',
    consent: '我同意为产品研究共享上面显示的区间和类别。',
    submit: '共享这些区间', saving: '正在共享…', saved: '提交内容已保存。', duplicate: '此提交内容已保存。', error: '无法保存提交内容。计算结果不受影响。', retry: '重试共享',
    delete: '删除此浏览器的提交内容', deleting: '正在删除…', deleted: (count: number) => `已删除 ${count} 条提交内容。`, none: '未找到此浏览器拥有的提交内容。', deleteError: '无法删除提交内容。系统未将其显示为已删除。',
  },
} as const;

type SaveState = 'idle' | 'saving' | 'stored' | 'duplicate' | 'error';
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

function SharePanel({ snapshot, locale, label }: Readonly<{
  snapshot: NormalizedToolResearchSnapshot;
  locale: ToolResearchLocale;
  label?: string;
}>) {
  const copy = COPY[locale];
  const retryId = useRef<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<SaveState>('idle');
  const preview = toolResearchPreview(snapshot, locale);
  const submit = async () => {
    if (!consent || state === 'saving') return;
    retryId.current ??= globalThis.crypto.randomUUID();
    setState('saving');
    try {
      const result = await submitToolResearch(snapshot, retryId.current);
      setState(result.state);
    } catch {
      setState('error');
    }
  };
  const status = state === 'stored' ? copy.saved
    : state === 'duplicate' ? copy.duplicate
      : state === 'error' ? copy.error : null;
  return <details className={styles.panel}>
    <summary>{label === undefined ? copy.summary : `${copy.summary} · ${label}`}</summary>
    <div className={styles.body}>
      <p className={styles.intro}>{copy.intro}</p>
      <dl className={styles.preview}>
        {preview.map((row) => <div key={`${row.label}:${row.value}`}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
      </dl>
      <p className={styles.privacy}>{copy.privacy}</p>
      <label className={styles.consent}>
        <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); if (state === 'error') setState('idle'); }} />
        <span>{copy.consent}</span>
      </label>
      <div className={styles.actions}>
        <button type="button" disabled={!consent || state === 'saving' || state === 'stored' || state === 'duplicate'} onClick={submit}>
          {state === 'saving' ? copy.saving : state === 'error' ? copy.retry : copy.submit}
        </button>
        {status === null ? null : <p className={styles.status} role="status">{status}</p>}
      </div>
      <div className={styles.delete}>
        <ToolResearchDeleteControl locale={locale} disabled={state === 'saving'} onDeleted={() => { setConsent(false); setState('idle'); }} />
      </div>
    </div>
  </details>;
}

export function ToolResearchShare({ snapshot, resultRevision, locale = 'en', label }: Readonly<{
  snapshot: NormalizedToolResearchSnapshot | null;
  resultRevision: string | number;
  locale?: ToolResearchLocale;
  label?: string;
}>) {
  if (snapshot === null) return null;
  return <SharePanel key={toolResearchPanelKey(snapshot, resultRevision)} snapshot={snapshot} locale={locale} label={label} />;
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
