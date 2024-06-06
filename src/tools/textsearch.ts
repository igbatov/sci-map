// FlexSearch for full-text search
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import FlexSearch from "flexsearch/dist/module/index.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { stemmer, filter, matcher } from "flexsearch/dist/module/lang/en.js";
const indexTitle = new FlexSearch({
  tokenize: "forward",
  encode: (str: string) => {
    return str.split(/\s+/);
  },
  rtl: false,
  stemmer: stemmer,
  matcher: matcher,
  filter: filter
});

const indexContent = new FlexSearch({
  tokenize: "forward",
  encode: (str: string) => {
    return str.split(/\s+/);
  },
  rtl: false,
  stemmer: stemmer,
  matcher: matcher,
  filter: filter
});

const indexUserComment = new FlexSearch({
  tokenize: "forward",
  encode: (str: string) => {
    return str.split(/\s+/);
  },
  rtl: false,
  stemmer: stemmer,
  matcher: matcher,
  filter: filter
});

export enum SearchFieldName {
  Title = "Title",
  Content = "Content",
  UserComment = "UserComment"
}

// best practice is to use numbers as ids for FlexSearch
let idMapCnt = 0;
const nodeIDMap = {} as Record<string, number>;
const searchIdMap = {} as Record<number, string>;

export function add(nodeID: string, field: SearchFieldName, text: string) {
  if (!nodeIDMap[nodeID]) {
    idMapCnt++;
    nodeIDMap[nodeID] = idMapCnt;
    searchIdMap[idMapCnt] = nodeID;
  }
  if (field === SearchFieldName.Title) {
    indexTitle.add(nodeIDMap[nodeID], text.toLowerCase());
  }
  if (field === SearchFieldName.Content) {
    indexContent.add(nodeIDMap[nodeID], text.toLowerCase());
  }
  if (field === SearchFieldName.UserComment) {
    indexUserComment.add(nodeIDMap[nodeID], text.toLowerCase());
  }
}

export async function search(text: string): Promise<Array<string>> {
  const ids1 = await indexTitle.search(text.toLowerCase());
  const ids2 = await indexContent.search(text.toLowerCase());
  const ids3 = await indexUserComment.search(text.toLowerCase());
  const result = [] as string[];
  result.push(...ids1.map((id: number) => searchIdMap[id]));
  result.push(...ids2.map((id: number) => searchIdMap[id]));
  result.push(...ids3.map((id: number) => searchIdMap[id]));
  return result;
}
