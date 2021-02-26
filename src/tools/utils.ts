import { cloneDeep } from "lodash";
import {Point, Polygon, Tree, TreeNodeResource, TreeSkeleton, Viewport} from "@/types/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
import {getBoundingBorders, getVoronoiCells} from "@/tools/graphics";

export const ROUND_EPSILON = 0;

export function round(num: number): number {
  const t =  Math.pow(10, ROUND_EPSILON)
  return Math.round(num * t) / t
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function clone(v: any): any {
  return cloneDeep(v);
}

export function generateTreeSkeleton(
  levelsNum: number,
  numOnLevel: number
): TreeSkeleton {
  let globalID = 0;
  const root = { id: globalID, children: [] };
  let toProcess: TreeSkeleton[] = [root];
  for (let i = 1; i < levelsNum; i++) {
    const nextToProcess = [];
    while (toProcess.length) {
      const node = toProcess.shift();
      node!.children = [];
      for (let j = 0; j < numOnLevel; j++) {
        globalID++;
        const child = { id: globalID };
        node!.children.push(child);
        nextToProcess.push(child);
      }
    }
    toProcess = nextToProcess;
  }

  return root;
}

/**
 * Fill TreeSkeleton with default values to make real Tree
 * @param sk
 */
export function skeletonToTree(sk: TreeSkeleton, idAsTitle: boolean): Tree {
  const res = clone(sk);
  const stack: TreeSkeleton[] = [res];
  while (stack.length) {
    const node = stack.pop();
    if (!node) {
      continue;
    }
    if (!node.title) {
      node.title = idAsTitle ? String(node.id) : "";
    }
    if (!node.position) {
      node.position = { x: 0, y: 0 };
    }
    if (!node.wikipedia) {
      node.wikipedia = "";
    }
    if (!node.resources) {
      node.resources = [];
    }
    if (!node.children) {
      node.children = [];
    }

    stack.push(...node.children);
  }
  return res as Tree;
}

/**
 * Traverse tree and fill position
 */
export function fillTreePositions(
  tree: Tree,
  rootWH: Viewport
): ErrorKV | null {
  if (tree.id !== 0) {
    return NewErrorKV("fillTreePositions: root node id must be 0", { tree });
  }
  tree.position = { x: rootWH.width / 2, y: rootWH.height / 2 };
  const nodeBorders: Record<number, { topLeft: Point; bottomRight: Point }> = {
    0: {
      topLeft: { x: 0, y: 0 },
      bottomRight: { x: rootWH.width, y: rootWH.height }
    }
  };
  const stack: Tree[] = [tree];
  while (stack.length) {
    const node = stack.pop();
    if (!node || !node.children || !node.children.length) {
      continue;
    }
    const borderBox = nodeBorders[node.id];
    const height = borderBox.bottomRight.y - borderBox.topLeft.y;
    const width = borderBox.bottomRight.x - borderBox.topLeft.x;
    if (height > width) {
      for (const i in node.children) {
        node.children[i].position = {
          x: node.position!.x,
          y: borderBox.topLeft.y + (Number(i) + 1 / 2) * (height / node.children.length)
        };
      }
    } else {
      for (const i in node.children) {
        node.children[i].position = {
          x: borderBox.topLeft.x +
            ((Number(i) + 1 / 2) * width) / node.children.length,
          y: node.position!.y
        };
      }
    }

    // compute children borders as voronoi cells bounding boxes
    const [cells, err] = getVoronoiCells([
      {x:borderBox.topLeft.x, y:borderBox.topLeft.y},
      {x:borderBox.bottomRight.x, y:borderBox.topLeft.y},
      {x:borderBox.bottomRight.x, y:borderBox.bottomRight.y},
      {x:borderBox.topLeft.x, y:borderBox.bottomRight.y},
    ], node.children.map(ch => ch.position))
    if (err) {
      return NewErrorKV("fillTreePositions: error in getVoronoiCells", { err });
    }
    for (const i in cells) {
      const cellBBox = getBoundingBorders(cells[i].border)
      nodeBorders[node.children[i].id] = {
        topLeft: cellBBox.leftBottom,
        bottomRight: cellBBox.rightTop
      };
    }

    stack.push(...node.children);
  }

  return null;
}

export function printError(msg: string, kv: any) {
  if (!kv) {
    console.error(msg)
  }

  // const callback = function(stackframes: StackFrame[]) {
  //   const stringifiedStack = stackframes.map(function(sf) {
  //     return sf.toString();
  //   }).join('\n');
  //   console.error(msg, stringifiedStack);
  // };
  //
  // const errBack = function(e: Error) { console.log(e.message); };
  //
  const kvArr = []
  for (const i in kv) {
    kvArr.push(i, kv[i])
    // if (kv[i] instanceof Error) {
    //   StackTrace.get({offline: true}).then(callback).catch(errBack);
    // }
  }

  console.error(msg, ...kvArr)
}

type MindMeisterNode = {
  id: number;
  title: string;
  link: string | null;
  note: string | null;
  children: MindMeisterNode[]
}

function mindMeisterNoteToResources(note: string | null):Array<TreeNodeResource> {
  return []
}

export function mindMeisterToTree(mm: MindMeisterNode): TreeSkeleton | null {
  let tree = null
  const parents: Record<number, TreeSkeleton> = {} // key id, value - parent
  const stack = [mm];
  while (stack.length) {
    const mmNode = stack.pop()
    if (!mmNode) {
      return null
    }
    const treeNode: TreeSkeleton = {
      id: mmNode.id,
      title: mmNode.title,
      wikipedia: mmNode.link ? mmNode.link : "",
      resources: mindMeisterNoteToResources(mmNode.note),
      children: []
    }
    if (parents[mmNode.id]) {
      parents[mmNode.id].children!.push(treeNode)
    } else {
      tree = treeNode
    }
    for (const child of mmNode.children) {
      stack.push(child)
      parents[child.id] = treeNode
    }
  }

  return tree
}
