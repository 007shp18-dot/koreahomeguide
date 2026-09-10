export type PolicyStatus = 'announced' | 'consultation' | 'enacted' | 'effective' | 'amended' | 'expired';
export type PolicyEventType = 'announcement' | 'consultation-open' | 'consultation-close' | 'enacted' | 'effective' | 'amended' | 'suspended' | 'expired';

export type PolicyEvent = Readonly<{
  type: PolicyEventType;
  date: string;
  label: string;
  note?: string;
}>;

export type PolicyOfficialSource = Readonly<{
  publisher: string;
  title: string;
  href: string;
  checkedAt: string;
}>;

export type PolicyRecord = Readonly<{
  id: string;
  slug: string;
  marketId: 'kr-seoul' | 'sg-singapore';
  title: string;
  summary: string;
  status: PolicyStatus;
  announcedOn: string;
  enactedOn: string | null;
  effectiveOn: string | null;
  expiresOn: string | null;
  lastCheckedOn: string;
  affectedGroups: readonly string[];
  source: PolicyOfficialSource;
  events: readonly PolicyEvent[];
  beforeAfter: Readonly<{
    beforeLabel: string;
    beforeValue: string;
    afterLabel: string;
    afterValue: string;
  }> | null;
}>;

export type PolicyGroups = Readonly<{
  effectiveSoon: readonly PolicyRecord[];
  recentlyChanged: readonly PolicyRecord[];
  active: readonly PolicyRecord[];
  archive: readonly PolicyRecord[];
}>;
