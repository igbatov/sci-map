import { cloneDeep } from "lodash";

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function clone(v: any): any {
  return cloneDeep(v);
}
