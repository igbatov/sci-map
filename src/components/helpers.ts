import {NodeRecordItem} from "@/store/tree";

export function idToLink(id: string, nodeRecord: Record<string, NodeRecordItem>): string {
  return `<a href='/${id}'>${nodeRecord[id] ? nodeRecord[id].node.title : 'undefined'}</a>`
}

export function getArrayDiff(beforeArr: Array<string>, afterArr: Array<string>) {
  const beforeMap = {} as Record<string, boolean>
  for (const idx in beforeArr) {
    beforeMap[beforeArr[idx]] = true
  }
  const afterMap = {} as Record<string, boolean>
  for (const idx in afterArr) {
    afterMap[afterArr[idx]] = true
  }
  const added = []
  for (const id in afterMap) {
    if (!beforeMap[id]) {
      added.push(id)
    }
  }
  const removed = []
  for (const id in beforeMap) {
    if (!afterMap[id]) {
      removed.push(id)
    }
  }

  return [added, removed]
}
