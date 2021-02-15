/* eslint-disable  @typescript-eslint/no-explicit-any */
export default (message: string, kv: Record<string, any>) => {
  const err = new Error();
  return {
    message: message,
    kv: kv,
    stack: err.stack
  };
};
