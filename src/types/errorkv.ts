/* eslint-disable  @typescript-eslint/no-explicit-any */
export type ErrorKV = {
  message: string;
  kv: Record<string, any>;
} | null;
