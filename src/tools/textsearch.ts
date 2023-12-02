
// FlexSearch for full-text search
// @ts-ignore
import { Worker } from "flexsearch";
const index = new Worker({
  language: "en",
  tokenize: "forward"
});

export function add(id: string, text:string) {
  index.add(id, text);
}
export function search(text:string): Promise<Array<string>> {
  return index.search(text)
}
