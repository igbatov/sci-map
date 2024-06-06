import { NodeRecordItem } from "@/store/tree";
import { Tree } from "@/types/graphics";

export function idToLink(
  id: string,
  nodeRecord: Record<string, NodeRecordItem>
): string {
  return `<a href='/${id}'>${
    nodeRecord[id] ? nodeRecord[id].node.title : "undefined"
  }</a>`;
}

export function getArrayDiff(
  beforeArr: Array<string>,
  afterArr: Array<string>
) {
  const beforeMap = {} as Record<string, boolean>;
  for (const idx in beforeArr) {
    beforeMap[beforeArr[idx]] = true;
  }
  const afterMap = {} as Record<string, boolean>;
  for (const idx in afterArr) {
    afterMap[afterArr[idx]] = true;
  }
  const added = [];
  for (const id in afterMap) {
    if (!beforeMap[id]) {
      added.push(id);
    }
  }
  const removed = [];
  for (const id in beforeMap) {
    if (!afterMap[id]) {
      removed.push(id);
    }
  }

  return [added, removed];
}

export function getTreePathNodes(
  id: string,
  records: Record<string, NodeRecordItem>
): Array<Tree> {
  if (!records[id] || records[id].parent == null) {
    return [];
  }
  const result = [];
  let parent = records[records[id].parent!.id];
  while (parent !== null) {
    result.push(parent.node);
    if (parent.parent == null) {
      break;
    }
    parent = records[parent.parent.id];
  }
  return result;
}

export function getTreePathString(
  id: string,
  records: Record<string, NodeRecordItem>
): string {
  return getTreePathNodes(id, records)
    .filter(node => node.id !== "0")
    .map(node => node.title)
    .reverse()
    .join("/");
}

export function isWideScreen() {
  return window.innerWidth > window.innerHeight;
}
