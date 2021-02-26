/* eslint-disable  @typescript-eslint/no-explicit-any */
import { ErrorKV } from "@/types/errorkv";

export default (message: string, kv: Record<string, any>): ErrorKV => {
  const err = new Error(message);

  return {
    error: err,
    kv: kv
  };
};
