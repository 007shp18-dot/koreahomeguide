import Link from 'next/link';

import { createPolicyRepository } from '../../lib/policy/policy-repository.server';
import type { PolicyGroups, PolicyRecord } from '../../lib/policy/policy-types';
import styles from './newsroom.module.css';

const groupCopy = Object.freeze([
  Object.freeze({ key: 'effectiveSoon', eyebrow: 'Effective soon', title: 'Changes with a confirmed start date' }),
  Object.freeze({ key: 'recentlyChanged', eyebrow: 'Recently changed', title: 'Amendments in the last 90 days' }),
  Object.freeze({ key: 'active', eyebrow: 'Active', title: 'Current policy records' }),
  Object.freeze({ key: 'archive', eyebrow: 'Archive', title: 'Expired or superseded records' }),
] as const);

function dateValue(value: string | null): string {
  return value ?? 'Date not confirmed';
}

function PolicyDates({ policy }: Readonly<{ policy: PolicyRecord }>) {
  return <dl className={styles.policyDates}>
    <div><dt>Announced</dt><dd><time dateTime={policy.announcedOn}>{policy.announcedOn}</time></dd></div>
    <div><dt>Effective</dt><dd>{policy.effectiveOn === null ? dateValue(null) : <time dateTime={policy.effectiveOn}>{policy.effectiveOn}</time>}</dd></div>
    <div><dt>Expiry</dt><dd>{policy.expiresOn === null ? dateValue(null) : <time dateTime={policy.expiresOn}>{policy.expiresOn}</time>}</dd></div>
    <div><dt>Last checked</dt><dd><time dateTime={policy.lastCheckedOn}>{policy.lastCheckedOn}</time></dd></div>
  </dl>;
}

function PolicyRow({ policy }: Readonly<{ policy: PolicyRecord }>) {
  const market = policy.marketId === 'kr-seoul' ? 'Seoul' : 'Singapore';
  return <article className={styles.policyRow}>
    <div className={styles.policyRowHeading}>
      <span>{market} · {policy.status}</span>
      <h3><Link href={`/news/policy/${policy.slug}/`}>{policy.title}</Link></h3>
      <p>{policy.summary}</p>
    </div>
    <PolicyDates policy={policy} />
  </article>;
}

export function PolicyTracker({ policies, referenceDate }: Readonly<{
  policies: readonly PolicyRecord[];
  referenceDate: string;
}>) {
  const groups = createPolicyRepository(policies).group(referenceDate);
  return <main className={styles.policyTracker}>
    <header className={styles.indexHero}>
      <p>SignedPrice Policy Tracker</p>
      <h1>Follow the date a housing rule actually changes.</h1>
      <span>Announcement, enactment, effective date and expiry remain separate until an official source confirms each event.</span>
    </header>
    <nav className={styles.policyJump} aria-label="Policy groups">
      {groupCopy.map((group) => <a key={group.key} href={`#${group.key}`}>{group.eyebrow}</a>)}
    </nav>
    {groupCopy.map((group) => {
      const records: readonly PolicyRecord[] = groups[group.key as keyof PolicyGroups];
      return <section className={styles.policyGroup} id={group.key} key={group.key}>
        <header><p>{group.eyebrow}</p><h2>{group.title}</h2><span>{records.length} reviewed record{records.length === 1 ? '' : 's'}</span></header>
        {records.length === 0
          ? <p className={styles.policyEmpty}>No reviewed policy is in this group.</p>
          : records.map((policy) => <PolicyRow key={policy.id} policy={policy} />)}
      </section>;
    })}
  </main>;
}

export { PolicyDates };
