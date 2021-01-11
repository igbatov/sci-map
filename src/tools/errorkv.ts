/* eslint-disable  @typescript-eslint/no-explicit-any */
export default (message: string, kv: Record<string, any>) => {
  return {
    message: message,
    kv: kv
  };
};
