import { MapNode, Point, Tree } from "@/types/graphics";
import {
  convertPosition,
  getMaxDiagonal,
  getVectorLength,
  mergeMapNodeLayers,
  treeToMapNodeLayers,
  vectorOnNumber
} from "../../tools/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "../../tools/errorkv";
import { clone } from "../../tools/utils";
import { NodeRecordItem } from "@/store/tree/index";
import { v4 as uuidv4 } from "uuid";

export function findMapNode(
  id: string,
  mapNodeLayers: Array<Record<string, MapNode>>
): [MapNode | null, number | null] {
  for (const level in mapNodeLayers) {
    const layer = mapNodeLayers[Number(level)];
    if (layer && layer[id]) {
      return [layer[id], Number(level)];
    }
  }

  return [null, null];
}

export function findMapNodes(
  ids: string[],
  mapNodeLayers: Array<Record<string, MapNode>>
): MapNode[] {
  const result: MapNode[] = [];
  for (const layer of mapNodeLayers) {
    if (!layer) {
      continue;
    }
    for (const id of ids) {
      if (layer[id]) {
        result.push(layer[id]);
      }
    }
  }

  return result;
}

export function createNewNode(title: string, center: Point): Tree {
  return {
    id: uuidv4(),
    position: center,
    title: title,
    wikipedia: "",
    resources: [],
    children: []
  } as Tree;
}

/**
 * Вычисляет где можно поставить центр для нового подузла узла parent
 *
 * Логика добавления следующая.
 * Обозначим координаты центра узла parent как (Xc, Yc)
 * Если в узле нет ни одного подузла, то находим наибольшее расстояние между (Xc, Yc)
 * и вершинами границы, делим вектор соединяющий (Xc, Yc) и эту вершину пополам
 * и ставим там центр нового подузла
 *
 * Если в узле есть подузлы, берем подузел с наибольшей диагональю,
 * находим в нем наибольшую диагональ соединяющую 2 вершины границы,
 * делим ее пополам, старый центр ставим в центре одной половины, новый в центре другой.
 *
 * Добавляем рандом (см баг https://sci-map.atlassian.net/browse/SM-118)
 * @param parent
 * @param mapNodeLayers
 * @param addRandom
 */
export function getNewNodeCenter(
  parent: Tree,
  mapNodeLayers: Array<Record<number, MapNode>>,
  addRandom: boolean,
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
      from: parentMapNode.center,
      to: p
    }));
    let maxFromCenterVector = fromCenterVectors[0];
    for (const v of fromCenterVectors) {
      if (getVectorLength(v) > getVectorLength(maxFromCenterVector)) {
        maxFromCenterVector = v;
      }
    }

    let coeff = 1/2
    if (addRandom) {
      coeff = Math.floor(Math.random() * (1/2) + 1/4)
    }

    return [
      {
        x:
          maxFromCenterVector.from.x +
          coeff * (maxFromCenterVector.to.x - maxFromCenterVector.from.x),
        y:
          maxFromCenterVector.from.y +
          coeff * (maxFromCenterVector.to.y - maxFromCenterVector.from.y)
      },
      null,
      null
    ];
  } else {
    const maxDiagChild = parent.children[0];
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

      const [childDiag, err1] = getMaxDiagonal(childMapNode.border);
      if (err1) {
        return [
          null,
          null,
          NewErrorKV("getNewNodeCenter: error getMaxDiagonal", {
            childMapNode,
            err1
          })
        ];
      }
      const [maxDiag, err2] = getMaxDiagonal(maxDiagChildMapNode.border);
      if (err2) {
        return [
          null,
          null,
          NewErrorKV("getNewNodeCenter: error getMaxDiagonal", {
            maxDiagChildMapNode,
            err2
          })
        ];
      }
      if (getVectorLength(childDiag) > getVectorLength(maxDiag)) {
        maxDiagChildMapNode = childMapNode;
      }
    }

    let coeff = 3 / 4
    if (addRandom) {
      coeff = Math.floor(Math.random() * (1/4) + 2.5/4)
    }

    const [finalMaxDiag] = getMaxDiagonal(maxDiagChildMapNode.border);
    const newNodeCenter = vectorOnNumber(finalMaxDiag!, coeff).to;
    const modifiedNode = clone(maxDiagChild);
    modifiedNode.position = vectorOnNumber(finalMaxDiag!, 1 / 4).to;
    return [newNodeCenter, modifiedNode, null];
  }
}

export function updatePosition(
  state: {
    tree: Tree | null;
    nodeRecord: Record<string, NodeRecordItem>;
    mapNodeLayers: Array<Record<string, MapNode>>;
  },
  v: { nodeId: string; position: Point }
): ErrorKV {
  if (state.tree == null) {
    return NewErrorKV("state.tree == null", {});
  }

  const item = state.nodeRecord[v.nodeId];
  if (!item) {
    return NewErrorKV("updateNodePosition: cannot find node in nodeRecord", {
      "v.nodeId": v.nodeId,
      "state.nodeRecord": state.nodeRecord
    });
  }

  if (!item.parent) {
    return NewErrorKV("updateNodePosition: cannot move root of tree", {
      "v.nodeId": v.nodeId
    });
  }

  const [normalizedPosition] = convertPosition(
    "normalize",
    v.position,
    item.parent.id,
    state.mapNodeLayers
  );
  item.node.position = normalizedPosition!;

  // Если мы меняем один узел, то могут поменяться границы всех соседей
  // так что надо действовать так как будто поменялись границы всех подузлов родителя узла
  const [parentMapNode, layerLevel] = findMapNode(
    item.parent.id,
    state.mapNodeLayers
  );
  if (!parentMapNode || layerLevel === null) {
    return NewErrorKV("updateNodePosition: cannot find mapNode for parent", {
      id: item.parent.id,
      "state.mapNodeLayers": state.mapNodeLayers
    });
  }
  const [ls, err] = treeToMapNodeLayers(
    item.parent,
    parentMapNode.border,
    parentMapNode.center
  );
  if (ls == null || err != null) {
    return NewErrorKV("updateNodePosition: create layers for parent", {
      id: item.parent.id,
      parentMapNode: parentMapNode
    });
  }
  return mergeMapNodeLayers(state.mapNodeLayers, ls, layerLevel);
}
