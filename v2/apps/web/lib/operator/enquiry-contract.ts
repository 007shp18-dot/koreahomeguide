export const ENQUIRY_NOTICE = 'purchase-enquiry-2026-09-16';
export const enquiryPurposes = ['own-use', 'rental', 'both', 'exploring'] as const;
export const enquiryTimings = ['soon', 'this-year', 'later', 'undecided'] as const;
export type PurchaseEnquiryInput = {
  requestId: string; email: string; city: 'seoul' | 'singapore' | 'dubai' | 'tokyo';
  locale: 'en' | 'ko' | 'zh-CN'; budget: string;
  purpose: typeof enquiryPurposes[number]; timing: typeof enquiryTimings[number];
  context: string; consentVersion: typeof ENQUIRY_NOTICE; consent: true;
};
export const enquiryId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function parsePurchaseEnquiry(value: unknown): PurchaseEnquiryInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (!enquiryId(v.requestId) || typeof v.email !== 'string' || typeof v.budget !== 'string' || typeof v.context !== 'string') return null;
  const email = v.email.trim().toLowerCase(), context = v.context.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\u0000-\u001f\u007f]/.test(email)) return null;
  if (v.budget !== '' && (!/^\d{1,12}(\.\d{1,2})?$/.test(v.budget) || Number(v.budget) <= 0)) return null;
  if (context.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(context)) return null;
  if (!['seoul', 'singapore', 'dubai', 'tokyo'].includes(String(v.city)) || !['en', 'ko', 'zh-CN'].includes(String(v.locale))
    || !enquiryPurposes.includes(v.purpose as PurchaseEnquiryInput['purpose']) || !enquiryTimings.includes(v.timing as PurchaseEnquiryInput['timing'])
    || v.consent !== true || v.consentVersion !== ENQUIRY_NOTICE) return null;
  return { requestId: v.requestId, email, context, budget: v.budget, city: v.city as PurchaseEnquiryInput['city'],
    locale: v.locale as PurchaseEnquiryInput['locale'], purpose: v.purpose as PurchaseEnquiryInput['purpose'], timing: v.timing as PurchaseEnquiryInput['timing'], consent: true, consentVersion: ENQUIRY_NOTICE };
}
