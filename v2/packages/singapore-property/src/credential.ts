export type UraCredential = Readonly<{ accessKey: string }>;

export function readUraCredential(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): UraCredential {
  const accessKey = environment.SIGNEDPRICE_URA_ACCESS_KEY;
  if (typeof accessKey !== 'string' || accessKey.trim().length === 0) {
    throw new Error('URA access is not configured.');
  }
  return Object.freeze({ accessKey });
}

export function redactUraDiagnostic(_diagnostic: unknown): 'URA provider request failed.' {
  return 'URA provider request failed.';
}
