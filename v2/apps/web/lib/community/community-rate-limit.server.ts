import 'server-only';

export type CommunityRateLimitPort = Readonly<{
  consume(input: Readonly<{
    respondentKey: string;
    networkKey: string;
  }>): Promise<'allowed' | 'limited'>;
}>;
