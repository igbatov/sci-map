import { DBNode } from "@/api/types";
import { Point, Polygon, Tree } from "@/types/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "../tools/errorkv";
import { getVoronoiCellRecords, morphChildrenPoints } from "../tools/graphics";

// convert children object to array
export function convertChildren(children: any): string[] {
  let result: string[];

  if (!children) {
    result = [];
  } else if (Array.isArray(children)) {
    result = children.filter(childID => !!childID).sort();
    result.forEach((childID, i, arr) => (arr[i] = childID.toString()));
  } else {
    result = Object.values(children)
      .filter(childID => !!childID)
      .sort() as string[];
    result.forEach((childID, i, arr) => (arr[i] = childID.toString()));
  }
  return result;
}

export function convertDBMapToTree(
  dbNodes: Record<string, DBNode>
): [Tree | null, ErrorKV] {
  const root: Tree = {
    id: dbNodes["0"].id.toString(),
    title: dbNodes["0"].name,
    position: dbNodes["0"].position,
    children: []
  };
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }
    if (!dbNodes[node.id]) {
      return [
        null,
        NewErrorKV("Cannot find id in dbNodes", { "node.id": node.id, dbNodes })
      ];
    }
    dbNodes[node.id].children = convertChildren(dbNodes[node.id].children);
    if (!dbNodes[node.id].children.length) {
      continue;
    }
    const children: Tree[] = [];
    for (const childID of dbNodes[node.id].children) {
      if (!dbNodes[childID]) {
        return [
          null,
          NewErrorKV("Cannot find child id in dbNodes", { childID, "parentID":node.id })
        ];
      }
      children.push({
        id: childID.toString(),
        title: dbNodes[childID].name,
        position: dbNodes[childID].position,
        children: []
      });
    }

    node.children = children;
    stack.push(...children);
  }

  return [root, null];
}
