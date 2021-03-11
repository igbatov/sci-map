import {MapNode, Point, Polygon, Viewport} from "@/types/graphics";
import {area, intersect, isInside, vectorOnNumber} from "@/tools/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
import { NodeRecordItem } from "@/store/tree";
import { findMapNode } from "@/store/tree/helpers";
import { clone } from "@/tools/utils";

const MIN_VISIBLE_NUM_IN_LAYER = 2;

export function zoomAndPanPoint(p: Point, zoom: number, pan: Point): Point {
  return {x: p.x * zoom + pan.x, y: p.y * zoom + pan.y}
}
export function zoomAndPanPolygon(p: Polygon, zoom: number, pan: Point): Polygon {
  return p.map(point => zoomAndPanPoint(point, zoom, pan))
}
/**
 * CurrentNode вычисляется следующим образом.
 * Начинаем смотреть с самого верхнего слоя.
 * Для каждого узла слоя прменяем zoomFactor, потом pan, потом вычисляем площадь пересечения этого узла
 * с прямоугольником экрана (= видимой областью)
 * Берем узел N с наибольшей площадью пересечения. Берем его полную площадь и умножаем на 2.
 * Если получившееся значение ≤ площади экрана, то мы считаем что currentNode это parent узла N
 * Если больше то считаем N за currentNode и повторяем итерацию но только с детьми N.
 * @param layers
 * @param nodeRecord
 * @param viewport
 */
export function findCurrentNode(
  layers: Array<Record<number, MapNode>>,
  nodeRecord: Record<number, NodeRecordItem>,
  viewport: Viewport,
  zoomFactor: number,
  pan: Point,
  zoomCenter: Point
): [number, ErrorKV] {
  if (!layers || layers.length == 0) {
    return [0, null];
  }
  const viewportPolygon = [
    { x: 0, y: 0 },
    { x: viewport.width, y: 0 },
    { x: viewport.width, y: viewport.height },
    { x: 0, y: viewport.height }
  ];
  let underCursorNodeId = null;
  const viewportArea = viewport.width * viewport.height;
  let nodesToCheck = layers[0];
  while (Object.keys(nodesToCheck).length) {
    underCursorNodeId = -1;

    for (const nodeId in nodesToCheck) {
      const borderToCheck = zoomAndPanPolygon(nodesToCheck[nodeId].border, zoomFactor, pan)
      if (isInside(zoomCenter, borderToCheck)) {
        underCursorNodeId = Number(nodeId)
        break
      }
    }

    if (underCursorNodeId === -1) {
      return [
        0,
        NewErrorKV(
          "findCurrentNode: cannot find intersections with viewport among nodesToCheck",
          { nodesToCheck, viewport }
        )
      ];
    }

    const underCursorNodeArea = area(zoomAndPanPolygon(nodesToCheck[underCursorNodeId].border, zoomFactor, pan));
    if (
      Math.floor(underCursorNodeArea) <=
      Math.floor(viewportArea / MIN_VISIBLE_NUM_IN_LAYER)
    ) {
      if (nodeRecord[underCursorNodeId].parent == null) {
        return [underCursorNodeId, null];
      }
      return [nodeRecord[underCursorNodeId].parent!.id, null];
    } else {
      nodesToCheck = {};
      if (!nodeRecord[underCursorNodeId]) {
        return [
          0,
          NewErrorKV(
            "findCurrentNode: cannot find underCursorNodeId in nodeRecord",
            { maxIntersectNodeId: underCursorNodeId, nodeRecord }
          )
        ];
      }
      for (const child of nodeRecord[underCursorNodeId].node.children) {
        const [mapNode] = findMapNode(child.id, layers);
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
        return [underCursorNodeId, null];
      }
    }
  }

  return [0, NewErrorKV("filterNodesAndLayers: unknown error", {})];
}

/**
 * Мы показываем слой в котором находится currentNode (без названий) плюс еще 3.
 * Причем полноценно мы показываем только подузлы currentNode.
 * Узлы слоя currentNode отображаются только если у них тот же parent что и у
 * currentNode. Плюс подузлы НЕ ИЗ currentNode мы отображаем только одного следующего слоя.
 * @param layers
 * @param nodeRecord
 * @param currentNodeId
 */
export function filterNodesAndLayers(
  layers: Array<Record<number, MapNode>>,
  nodeRecord: Record<number, NodeRecordItem>,
  currentNodeId: number
): [Array<Record<number, MapNode>>, ErrorKV] {
  if (!layers || !layers.length) {
    return [[], null];
  }
  const resultLayers = [];

  // узнаем какой слой у currentNode
  const [currentNode, level] = findMapNode(currentNodeId, layers);
  if (currentNode == null || level == null) {
    return [
      [],
      NewErrorKV("filterNodesAndLayers-currentNode: error in findMapNode", {
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
          NewErrorKV("filterNodesAndLayers-upperLayer: error in findMapNode", {
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
          NewErrorKV("filterNodesAndLayers-firstLayer: error in findMapNode", {
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
  //for (const childId in firstLayer) {
  for (const child of nodeRecord[currentNodeId].node.children) {
    for (const childOfChild of nodeRecord[child.id].node.children) {
      const [mapNode, _] = findMapNode(childOfChild.id, [layers[level + 2]]);
      if (mapNode == null || _ == null) {
        return [
          [],
          NewErrorKV("filterNodesAndLayers-secondLayer: error in findMapNode", {
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

  // следующий это дети узлов из secondLayer и у них нет названий
  const thirdLayer: Record<number, MapNode> = {};
  for (const nodeId in secondLayer) {
    for (const child of nodeRecord[nodeId].node.children) {
      const [mapNode, _] = findMapNode(child.id, [layers[level + 3]]);
      if (mapNode == null || _ == null) {
        return [
          [],
          NewErrorKV("filterNodesAndLayers-thirdLayer: error in findMapNode", {
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

export function zoomAnPanLayers(
  inLayers: Array<Record<number, MapNode>>,
  zoom: number,
  pan: Point
): Array<Record<number, MapNode>> {
  const layers = clone(inLayers);
  if (!layers || layers.length == 0) {
    return [];
  }
  for (const layer of layers) {
    for (const id in layer) {
      const node = layer[id];
      node.center = zoomAndPanPoint(node.center, zoom, pan);
      node.border = zoomAndPanPolygon(node.border, zoom, pan)
    }
  }

  return layers;
}
