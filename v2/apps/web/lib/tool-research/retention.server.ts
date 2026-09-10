import 'server-only';

// Every aggregate uses the same consent and retention boundary. Owner withdrawal
// physically deletes its rows, so no persisted count can outlive consent.
export function retainedResearchPredicate(instant: string): string {
  return `expires_at > ${instant}
    AND created_at > ${instant} - interval '90 days'
    AND created_at <= ${instant}
    AND source = 'user_scenario' AND purpose = 'product_research'
    AND consent_granted_at IS NOT NULL
    AND consent_version = 'tool-research-consent-2026-09-09'`;
}
