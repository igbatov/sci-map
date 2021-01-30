import { MapNode, Point, Tree } from "@/types/graphics";
import {
  getMaxDiagonal,
  getVectorLength,
  morphChildrenPoints,
  treeToMapNodeLayers,
  vectorOnNumber
} from "@/tools/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
import { clone } from "@/tools/utils";
import { NodeRecordItem, State } from "@/store/tree/index";
import { cloneDeep } from "lodash";

export function findMapNode(
  id: number,
  mapNodeLayers: Array<Record<number, MapNode>>
): [MapNode | null, number | null] {
  for (const layer of mapNodeLayers) {
    if (layer[id]) {
      return [layer[id], id];
    }
  }

  return [null, null];
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

  let inProcess = [...item.parent.children];
  let newLayers: Array<Record<number, MapNode>> | null = null;
  let err: ErrorKV = null;
  while (inProcess.length) {
    // save old borders of nodes
    const oldMapNodes: Record<number, MapNode> = {};
    for (const node of inProcess) {
      const [oldMapNode] = cloneDeep(findMapNode(node.id, state.mapNodeLayers));
      if (oldMapNode == null) {
        console.error(
          "Cannot find oldMapNode",
          "nodeId",
          v.nodeId,
          "layers",
          state.mapNodeLayers
        );
        return;
      }
      oldMapNodes[oldMapNode.id] = oldMapNode;
    }

    // recalculate new borders for nodes in inProcess
    [newLayers, err] = treeToMapNodeLayers(state.tree);
    if (newLayers == null || err != null) {
      console.error(
        "updateNodePosition: cannot treeToMapNodeLayers",
        "err",
        err,
        "state.tree",
        state.tree
      );
      return;
    }

    // calculate children positions for nodes in inProcess
    const newInProcess = [];
    for (const node of inProcess) {
      const [newMapNode] = findMapNode(node.id, newLayers);
      if (newMapNode == null) {
        console.error(
          "Cannot find newMapNode",
          "nodeId",
          v.nodeId,
          "layers",
          state.mapNodeLayers
        );
        return;
      }

      if (state.nodeRecord[node.id].node.children.length == 0) {
        continue;
      }

      const [newChildrenPositions, err] = morphChildrenPoints(
        oldMapNodes[newMapNode.id].border,
        newMapNode.border,
        state.nodeRecord[newMapNode.id].node.children.reduce((prev, curr) => {
          prev[curr.id] = curr.position;
          return prev;
        }, {} as Record<number, Point>)
      );
      if (err != null) {
        console.error(
          "updateNodePosition: cannot morphChildrenPoints",
          "err",
          err,
          "oldMapNodes[newMapNode.id].border",
          oldMapNodes[newMapNode.id].border,
          "newMapNode.border",
          newMapNode.border,
          "children positions",
          state.nodeRecord[newMapNode.id].node.children.map(ch => ch.position)
        );
        return;
      }

      for (const id in newChildrenPositions) {
        state.nodeRecord[Number(id)].node.position =
          newChildrenPositions[Number(id)];
        newInProcess.push(state.nodeRecord[Number(id)].node);
      }
    }
    inProcess = newInProcess;
  }

  if (newLayers == null) {
    console.error("updateNodePosition: newLayers is null");
    return;
  }
  state.mapNodeLayers = newLayers;
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
  const [parentMapNode, _] = findMapNode(parent.id, mapNodeLayers);
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
      const [childMapNode, _] = findMapNode(child.id, mapNodeLayers);
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
