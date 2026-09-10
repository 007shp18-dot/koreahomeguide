import type { SiteLocale } from '../../lib/navigation/site-navigation';
import styles from './tool-loading.module.css';

export function ToolLoading({ locale = 'en' }: Readonly<{ locale?: SiteLocale }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  return <main className={styles.page} aria-busy="true" data-tool-loading="true">
    <p className={styles.label}>{ko ? '도구' : zh ? '工具' : 'Tools'}</p>
    <h1>{ko ? '도구 준비 중' : zh ? '正在准备工具' : 'Preparing your tool'}</h1>
    <p role="status">{ko ? '입력 양식과 비교 자료를 불러오는 중…' : zh ? '正在加载表单和比较资料…' : 'Loading the form and comparison data…'}</p>
    <div className={styles.workspace} aria-hidden="true"><div><i /><i /><i /></div><div /></div>
  </main>;
}
