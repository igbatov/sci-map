
exports.getArrayDiff = function(beforeArr: Array<string>, afterArr: Array<string>) {
  const beforeMap = {} as Record<string, boolean>
  for (const idx in beforeArr) {
    beforeMap[beforeArr[idx]] = true
  }
  const afterMap = {} as Record<string, boolean>
  for (const idx in afterArr) {
    afterMap[afterArr[idx]] = true
  }
  const added = [] as Array<string>
  for (const id in afterMap) {
    if (!beforeMap[id]) {
      added.push(id)
    }
  }
  const removed = [] as Array<string>
  for (const id in beforeMap) {
    if (!afterMap[id]) {
      removed.push(id)
    }
  }

  return [added, removed]
}
