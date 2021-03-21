import { MapNode, Point, Tree } from "@/types/graphics";
import {
  getMaxDiagonal,
  getVectorLength,
  getVoronoiCells,
  morphChildrenPoints,
  vectorOnNumber
} from "@/tools/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
import { clone } from "@/tools/utils";
import { NodeRecordItem } from "@/store/tree/index";

export function findMapNode(
  id: number,
  mapNodeLayers: Array<Record<number, MapNode>>
): [MapNode | null, number | null] {
  let level = 0;
  for (const layer of mapNodeLayers) {
    if (layer && layer[id]) {
      return [layer[id], level];
    }
    level++;
  }

  return [null, null];
}

export function findMapNodes(
  ids: number[],
  mapNodeLayers: Array<Record<number, MapNode>>
): MapNode[] {
  const result: MapNode[] = []
  for (const layer of mapNodeLayers) {
    if (!layer) {
      continue
    }
    for (const id of ids) {
      if (layer[id]) {
        result.push(layer[id])
      }
    }
  }

  return result;
}

export function updatePosition(
  state: {
    tree: Tree | null;
    nodeRecord: Record<number, NodeRecordItem>;
    mapNodeLayers: Array<Record<number, MapNode>>;
  },
  v: { nodeId: number; position: Point }
) {
  if (state.tree == null) {
    return;
  }

  const item = state.nodeRecord[v.nodeId];
  if (!item) {
    console.error(
      "updateNodePosition: cannot find node in nodeRecord",
      "v.nodeId",
      v.nodeId,
      "state.nodeRecord",
      state.nodeRecord
    );
    return;
  }
  if (!item.parent) {
    console.error(
      "updateNodePosition: cannot move root of tree",
      "v.nodeId",
      v.nodeId
    );
    return;
  }

  item.node.position = v.position;

  // Если мы меняем один узел, то могут поменяться границы всех соседей
  // так что надо действовать так как будто поменялись границы всех подузлов родителя узла

  let inProcess = [item.parent];
  let newInProcess = [];
  while (inProcess.length) {
    newInProcess = [];
    const childMapNodes: Record<number, MapNode> = {};
    const childOldMapNodes: Record<number, MapNode> = {};
    for (const node of inProcess) {
      if (node.children.length == 0) {
        continue;
      }
      newInProcess.push(...node.children);
      const [nodeMapNode] = findMapNode(node.id, state.mapNodeLayers);
      // get borders of node children
      for (const child of node.children) {
        const [childMapNode] = findMapNode(child.id, state.mapNodeLayers);
        if (childMapNode == null) {
          console.error(
            "Cannot find oldMapNode",
            "child.id",
            child.id,
            "layers",
            state.mapNodeLayers
          );
          return;
        }
        childMapNodes[child.id] = childMapNode;
        childMapNodes[child.id].center =
          state.nodeRecord[child.id].node.position;
        childOldMapNodes[child.id] = clone(childMapNode);
      }

      // recalculate new borders for children
      const [cells, error] = getVoronoiCells(
        nodeMapNode!.border,
        node.children.map(ch => ({ x: ch.position.x, y: ch.position.y }))
      );
      if (error != null) {
        return [null, error];
      }

      let cellIndex = 0;
      for (const child of node.children) {
        // update borders in state.mapNodeLayers
        childMapNodes[child.id].border = cells[cellIndex].border;

        // calculate new position for each child of child (because its border was changed)
        const [newChildrenPositions] = morphChildrenPoints(
          childOldMapNodes[child.id].border,
          cells[cellIndex].border,
          state.nodeRecord[child.id].node.children.reduce((prev, curr) => {
            prev[curr.id] = curr.position;
            return prev;
          }, {} as Record<number, Point>)
        );

        // update positions in state
        for (const id in newChildrenPositions) {
          state.nodeRecord[Number(id)].node.position =
            newChildrenPositions[Number(id)];
        }
        cellIndex++;
      }
    }

    inProcess = newInProcess;
  }
}

/**
 * Вычисляет где можно поставить центр для нового подузла узла parent
 * Логика добавления следующая.
 *
 * Обозначим координаты центра узла (Xc, Yc)
 * Если в узле нет ни одного подузла, то находим наибольшее расстояние между (Xc, Yc)
 * и вершинами границы, делим вектор соединяющий (Xc, Yc) и эту вершину пополам
 * и ставим там центр нового подузла
 *
 * Если в узле есть подузлы, берем подузел с наибольшей площадью,
 * находим в нем наибольшую диагональ соединяющую 2 вершины границы,
 * делим ее пополам, старый центр ставим в центре одной половины, новый в центре другой
 * @param parent
 * @param mapNodeLayers
 */
export function getNewNodeCenter(
  parent: Tree,
  mapNodeLayers: Array<Record<number, MapNode>>
): [
  Point | null, // new node center
  Tree | null, // existing node with corrected center (if any)
  ErrorKV // error (if any)
] {
  const [parentMapNode] = findMapNode(parent.id, mapNodeLayers);
  if (parentMapNode === null) {
    return [
      null,
      null,
      NewErrorKV("getNewNodeCenter: cannot find mapNode for parent", {
        parentId: parent.id,
        mapNodeLayers: mapNodeLayers
      })
    ];
  }
  if (parent.children.length === 0) {
    const fromCenterVectors = parentMapNode.border.map(p => ({
      from: parent.position,
      to: p
    }));
    let maxFromCenterVector = fromCenterVectors[0];
    for (const v of fromCenterVectors) {
      if (getVectorLength(v) > getVectorLength(maxFromCenterVector)) {
        maxFromCenterVector = v;
      }
    }
    return [
      {
        x:
          maxFromCenterVector.from.x +
          (maxFromCenterVector.to.x - maxFromCenterVector.from.x) / 2,
        y:
          maxFromCenterVector.from.y +
          (maxFromCenterVector.to.y - maxFromCenterVector.from.y) / 2
      },
      null,
      null
    ];
  } else {
    let maxDiagChild = parent.children[0];
    let [maxDiagChildMapNode] = findMapNode(maxDiagChild.id, mapNodeLayers);
    if (maxDiagChildMapNode === null) {
      return [
        null,
        null,
        NewErrorKV("getNewNodeCenter: cannot find maxDiagChild in layers", {
          maxDiagChildId: maxDiagChild.id,
          mapNodeLayers: mapNodeLayers
        })
      ];
    }
    for (const child of parent.children) {
      const [childMapNode] = findMapNode(child.id, mapNodeLayers);
      if (childMapNode === null) {
        return [
          null,
          null,
          NewErrorKV("getNewNodeCenter: cannot find child in layers", {
            childId: child.id,
            mapNodeLayers: mapNodeLayers
          })
        ];
      }

      if (
        getVectorLength(getMaxDiagonal(childMapNode.border)) >
        getVectorLength(getMaxDiagonal(maxDiagChildMapNode.border))
      ) {
        maxDiagChild = child;
        const [newMaxDiagChildMapNode] = findMapNode(
          maxDiagChild.id,
          mapNodeLayers
        );
        if (newMaxDiagChildMapNode === null) {
          return [
            null,
            null,
            NewErrorKV("getNewNodeCenter: cannot find maxDiagChild in layers", {
              maxDiagChildId: maxDiagChild.id,
              mapNodeLayers: mapNodeLayers
            })
          ];
        }
        maxDiagChildMapNode = newMaxDiagChildMapNode;
      }
    }

    const maxDiag = getMaxDiagonal(maxDiagChildMapNode.border);
    const newNodeCenter = vectorOnNumber(maxDiag, 3 / 4).to;
    const modifiedNode = clone(maxDiagChild);
    modifiedNode.position = vectorOnNumber(maxDiag, 1 / 4).to;
    return [newNodeCenter, modifiedNode, null];
  }
}
