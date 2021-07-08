/* eslint-disable  @typescript-eslint/no-explicit-any */
export type ErrorKV = {
  error: Error;
  kv: Record<string, any>;
  code: number | undefined;
} | null;
