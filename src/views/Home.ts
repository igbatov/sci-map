import { MapNode, Viewport } from "@/types/graphics";
import { area, intersect } from "@/tools/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
import { NodeRecordItem } from "@/store/tree";
import { findMapNode } from "@/store/tree/helpers";
import { clone } from "@/tools/utils";

const MIN_VISIBLE_NUM_IN_LAYER = 3;

/**
 * CurrentNode вычисляется следующим образом.
 * Начинаем смотреть с самого верхнего слоя.
 * Для каждого узла слоя вычисляем площадь пересечения этого узла с прямоугольником экрана (= видимой областью)
 * Берем узел N с наибольшей площадью пересечения. Берем его полную площадь и умножаем на 3.
 * Если получившееся значение ≤ площади экрана, то мы считаем что currentNode это parent узла N
 * Если больше то считаем N за currentNode и повторяем итерацию но только с детьми N.
 * @param layers
 * @param nodeRecord
 * @param viewport
 */
export function findCurrentNode(
  layers: Array<Record<number, MapNode>>,
  nodeRecord: Record<number, NodeRecordItem>,
  viewport: Viewport
): [number, ErrorKV] {
  const viewportPolygon = [
    { x: 0, y: 0 },
    { x: viewport.width, y: 0 },
    { x: viewport.width, y: viewport.height },
    { x: 0, y: viewport.height }
  ];
  let maxIntersectNodeId = null;
  let maxIntersectArea = 0;
  const viewportArea = viewport.width * viewport.height;
  let nodesToCheck = layers[0];
  while (Object.keys(nodesToCheck).length) {
    maxIntersectNodeId = null;
    maxIntersectArea = 0;

    for (const nodeId in nodesToCheck) {
      const [intersectPoly, err] = intersect(
        nodesToCheck[nodeId].border,
        viewportPolygon
      );
      if (err !== null || intersectPoly === null) {
        return [
          0,
          NewErrorKV("filterLayer: error intersecting", {
            nodeId: nodeId,
            nodeBorder: nodesToCheck[nodeId].border,
            err: err
          })
        ];
      }

      if (intersectPoly.length === 0) {
        continue;
      }

      const intersectArea = area(intersectPoly[0]);
      if (intersectArea > maxIntersectArea) {
        maxIntersectNodeId = Number(nodeId);
        maxIntersectArea = intersectArea;
      }
    }

    if (maxIntersectNodeId === null) {
      return [
        0,
        NewErrorKV(
          "findCurrentNode: cannot find intersections with viewport among nodesToCheck",
          { nodesToCheck, viewport }
        )
      ];
    }

    const maxIntersectNodeArea = area(nodesToCheck[maxIntersectNodeId].border);
    if (
      Math.floor(maxIntersectNodeArea) <=
      Math.floor(viewportArea / MIN_VISIBLE_NUM_IN_LAYER)
    ) {
      if (nodeRecord[maxIntersectNodeId].parent == null) {
        return [maxIntersectNodeId, null];
      }
      return [nodeRecord[maxIntersectNodeId].parent!.id, null];
    } else {
      nodesToCheck = {};
      if (!nodeRecord[maxIntersectNodeId]) {
        return [
          0,
          NewErrorKV(
            "findCurrentNode: cannot find maxIntersectNodeId in nodeRecord",
            { maxIntersectNodeId, nodeRecord }
          )
        ];
      }
      for (const child of nodeRecord[maxIntersectNodeId].node.children) {
        const [mapNode, _] = findMapNode(child.id, layers);
        if (mapNode == null) {
          return [
            0,
            NewErrorKV("filterNodesAndLayers: Cannot find node in layers", {
              "child.id": child.id,
              layers: layers
            })
          ];
        }
        nodesToCheck[child.id] = mapNode;
      }

      if (Object.keys(nodesToCheck).length === 0) {
        return [maxIntersectNodeId, null];
      }
    }
  }

  return [0, NewErrorKV("filterNodesAndLayers: unknown error", {})];
}

/**
 * Мы показываем слой в котором находится currentNode (без названий) плюс еще 3.
 * Причем полноценно мы показываем только подузлы currentNode.
 * Узлы слоя currentNode отображаются только если у них тот же parent что и у
 * currentNode. Плюс подузлы НЕ ИЗ currentNode мы отображаем только одного следующего слоя и без названий.
 * @param layers
 * @param nodeRecord
 * @param viewport
 */
export function filterNodesAndLayers(
  layers: Array<Record<number, MapNode>>,
  nodeRecord: Record<number, NodeRecordItem>,
  viewport: Viewport
): [Array<Record<number, MapNode>>, ErrorKV] {
  const resultLayers = [];

  // вычисляем currentNodeId
  const [currentNodeId, err] = findCurrentNode(layers, nodeRecord, viewport);
  if (err != null) {
    return [
      [],
      NewErrorKV("filterNodesAndLayers: error in findCurrentNode", { err })
    ];
  }

  // узнаем какой слой у currentNode
  const [currentNode, level] = findMapNode(currentNodeId, layers);
  if (currentNode == null || level == null) {
    return [
      [],
      NewErrorKV("filterNodesAndLayers: error in findMapNode", {
        currentNodeId,
        layers
      })
    ];
  }

  // убираем из этого слоя все кроме детей currentNode.parent
  const upperLayer: Record<number, MapNode> = {};
  if (nodeRecord[currentNode.id].parent == null) {
    upperLayer[currentNode.id] = clone(currentNode);
  } else {
    for (const child of nodeRecord[currentNode.id].parent!.children) {
      const [mapNode, _] = findMapNode(child.id, [layers[level]]);
      if (mapNode == null || _ == null) {
        return [
          [],
          NewErrorKV("filterNodesAndLayers: error in findMapNode", {
            "child.id": child.id,
            level,
            layers: [layers[level]]
          })
        ];
      }
      upperLayer[child.id] = clone(mapNode);
      upperLayer[child.id].title = "";
    }
  }
  resultLayers.push(upperLayer);

  // следующий слой это дети всех узлов из upperLayer, но дети всех кроме currentNode не имеют названий
  const firstLayer: Record<number, MapNode> = {};
  for (const nodeId in upperLayer) {
    for (const child of nodeRecord[nodeId].node.children) {
      const [mapNode, _] = findMapNode(child.id, [layers[level + 1]]);
      if (mapNode == null || _ == null) {
        return [
          [],
          NewErrorKV("filterNodesAndLayers: error in findMapNode", {
            "child.id": child.id,
            layers: [layers[level]]
          })
        ];
      }
      if (Number(nodeId) != Number(currentNodeId)) {
        firstLayer[child.id] = clone(mapNode);
        firstLayer[child.id].title = "";
      } else {
        firstLayer[child.id] = clone(mapNode);
      }
    }
  }

  if (Object.keys(firstLayer).length > 0) {
    resultLayers.push(firstLayer);
  }

  // следующий слой это дети детей currentNode
  const secondLayer: Record<number, MapNode> = {};
  for (const child of nodeRecord[currentNodeId].node.children) {
    for (const childOfChild of nodeRecord[child.id].node.children) {
      const [mapNode, _] = findMapNode(childOfChild.id, [layers[level + 2]]);
      if (mapNode == null || _ == null) {
        return [
          [],
          NewErrorKV("filterNodesAndLayers: error in findMapNode", {
            "child.id": child.id,
            layers: [layers[level]]
          })
        ];
      }
      secondLayer[childOfChild.id] = clone(mapNode);
    }
  }

  if (Object.keys(secondLayer).length > 0) {
    resultLayers.push(secondLayer);
  }

  // следующий это дети детей детей currentNode и у них нет названий
  const thirdLayer: Record<number, MapNode> = {};
  for (const nodeId in secondLayer) {
    for (const child of nodeRecord[nodeId].node.children) {
      const [mapNode, _] = findMapNode(child.id, [layers[level + 3]]);
      if (mapNode == null || _ == null) {
        return [
          [],
          NewErrorKV("filterNodesAndLayers: error in findMapNode", {
            "child.id": child.id,
            layers: [layers[level]]
          })
        ];
      }
      thirdLayer[child.id] = clone(mapNode);
      thirdLayer[child.id].title = "";
    }
  }

  if (Object.keys(thirdLayer).length > 0) {
    resultLayers.push(thirdLayer);
  }

  return [resultLayers, null];
}
