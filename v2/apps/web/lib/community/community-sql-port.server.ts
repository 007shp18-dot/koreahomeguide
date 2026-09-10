import 'server-only';

export type CommunitySqlRow = Readonly<Record<string, unknown>>;

export type CommunitySqlTransaction = Readonly<{
  query(
    statement: string,
    parameters: readonly unknown[],
  ): Promise<readonly CommunitySqlRow[]>;
}>;

export type CommunitySqlPort = Readonly<{
  transaction<T>(
    operation: (client: CommunitySqlTransaction) => Promise<T>,
  ): Promise<T>;
}>;
