import 'server-only';

export type OperatorProfile = Readonly<{
  status: 'ready';
  operatorName: string;
  privacyContact: string;
}> | Readonly<{
  status: 'unavailable';
  missing: readonly ('operator name' | 'privacy contact')[];
}>;

const PLACEHOLDER = /^(?:tbd|todo|unknown|not configured|example)$/i;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function validOperatorName(value: string | undefined): string | null {
  const candidate = value?.trim() ?? '';
  if (
    candidate.length < 2 || candidate.length > 160 ||
    PLACEHOLDER.test(candidate) || /[<>]/.test(candidate)
  ) {
    return null;
  }
  return candidate;
}

function validPrivacyContact(value: string | undefined): string | null {
  const candidate = value?.trim() ?? '';
  if (candidate.length > 254 || !EMAIL.test(candidate)) return null;
  return candidate;
}

export function operatorProfileFromEnvironment(): OperatorProfile {
  const operatorName = validOperatorName(process.env.SIGNEDPRICE_OPERATOR_NAME);
  const privacyContact = validPrivacyContact(process.env.SIGNEDPRICE_PRIVACY_CONTACT);
  const missing: ('operator name' | 'privacy contact')[] = [];
  if (operatorName === null) missing.push('operator name');
  if (privacyContact === null) missing.push('privacy contact');

  if (operatorName === null || privacyContact === null) {
    return Object.freeze({ status: 'unavailable', missing: Object.freeze(missing) });
  }
  return Object.freeze({ status: 'ready', operatorName, privacyContact });
}
