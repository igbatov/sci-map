/* eslint-disable  @typescript-eslint/no-explicit-any */
import { ErrorKV } from "@/types/errorkv";

export const UNAUTHORIZED = 401

export default (message: string, kv: Record<string, any>, code?: number): ErrorKV => {
  const err = new Error(message);

  return {
    error: err,
    kv: kv,
    code,
  };
};
