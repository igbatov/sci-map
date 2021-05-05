import {DBNode} from "@/api/types";
import {Point, Polygon, Tree} from "@/types/graphics";
import {ErrorKV} from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
import {getVoronoiCellRecords, morphChildrenPoints} from "@/tools/graphics";

export function convertDBMapToTree(
  dbNodes: Record<string, DBNode>,
  rootWidth: number,
  rootHeight: number,
  stWidth: number,
  stHeight: number,
): [Tree | null, ErrorKV] {
  const normalizedBorder = [{x:0, y:0}, {x:0, y:stHeight}, {x:stWidth, y:stHeight}, {x:stWidth, y:0}]
  const borders: Record<string, Polygon> = {
    "0": [
      {x:0, y:0},
      {x:0, y:rootHeight},
      {x:rootWidth, y:rootHeight},
      {x:rootWidth, y:0}
    ],
  }

  const root: Tree = {
    id: dbNodes['0'].id,
    title: dbNodes['0'].name,
    position: {x:rootWidth/2, y:rootHeight/2},
    children: [],
    wikipedia: "",
    resources: [],
  };
  const stack = [root]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) {
      continue
    }
    if (!dbNodes[node.id]) {
      return [null, NewErrorKV("Cannot find id in dbNodes", {"node.id":node.id, dbNodes})]
    }
    if (!dbNodes[node.id].children) {
      continue
    }
    const children: Tree[] = []
    const childrenCenters = dbNodes[node.id].children.reduce((obj: Record<string, Point>, id) => {
      obj[id] = dbNodes[id].position;
      return obj;
    }, {})
    const [denormalizedPositions, err1] = morphChildrenPoints(
      normalizedBorder,
      borders[node.id],
      childrenCenters
    )
    if (err1 !== null) {
      return [null, err1]
    }

    const [childrenBorders, err2] = getVoronoiCellRecords(borders[node.id], denormalizedPositions!)
    if (err2 !== null) {
      return [null, err2]
    }
    for (const childID of dbNodes[node.id].children) {
      if (!childrenBorders[childID]) {
        return [null, NewErrorKV("Cannot find childID in childrenBorders", {childID, childrenBorders, "borders[node.id]":borders[node.id], childrenCenters})]
      }
      borders[childID] = childrenBorders[childID]
      children.push({
        id: childID,
        title: dbNodes[childID].name,
        position: denormalizedPositions![childID],
        children: [],
        wikipedia: "",
        resources: []
      })
    }

    node.children = children;
    stack.push(...children)
  }

  return [root, null]
}
