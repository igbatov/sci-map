import { MapNode, Point, Polygon, Viewport } from "@/types/graphics";
import { area, isInside } from "@/tools/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
import { NodeRecordItem } from "@/store/tree";
import { findMapNode } from "@/store/tree/helpers";
import { clone } from "@/tools/utils";

const MIN_VISIBLE_NUM_IN_LAYER = 2;

export function zoomAndPanPoint(p: Point, zoom: number, pan: Point): Point {
  return { x: p.x * zoom + pan.x, y: p.y * zoom + pan.y };
}
export function zoomAndPanPolygon(
  p: Polygon,
  zoom: number,
  pan: Point
): Polygon {
  return p.map(point => zoomAndPanPoint(point, zoom, pan));
}

/**
 * CurrentNode вычисляется следующим образом.
 * Начинаем смотреть с самого верхнего слоя.
 * Для каждого узла слоя прменяем zoomFactor, потом pan, потом
 * смотрим находится ли zoomCenter внутри него. Если да, то это претендент на currentNode (назовем его N).
 * Мы берем его полную площадь и умножаем на 2.
 * Если получившееся значение ≤ площади экрана, то мы считаем что currentNode это parent узла N
 * Если больше то повторяем итерацию но только с детьми N.
 * @param layers
 * @param nodeRecord
 * @param viewport
 * @param zoomFactor
 * @param pan
 * @param zoomCenter
 */
export function findCurrentNode(
  layers: Array<Record<string, MapNode>>,
  nodeRecord: Record<string, NodeRecordItem>,
  viewport: Viewport,
  zoomFactor: number,
  pan: Point,
  zoomCenter: Point
): [string, ErrorKV] {
  if (!layers || layers.length == 0) {
    return ["", null];
  }

  let underCursorNodeId = null;
  const viewportArea = viewport.width * viewport.height;
  let nodesToCheck = layers[0];
  while (Object.keys(nodesToCheck).length) {
    underCursorNodeId = "";

    for (const nodeId in nodesToCheck) {
      const borderToCheck = zoomAndPanPolygon(
        nodesToCheck[nodeId].border,
        zoomFactor,
        pan
      );
      if (isInside(zoomCenter, borderToCheck)) {
        underCursorNodeId = nodeId;
        break;
      }
    }

    if (underCursorNodeId === "") {
      return [
        "",
        NewErrorKV(
          "findCurrentNode: cannot find intersections with viewport among nodesToCheck",
          { nodesToCheck, viewport }
        )
      ];
    }

    const underCursorNodeArea = area(
      zoomAndPanPolygon(nodesToCheck[underCursorNodeId].border, zoomFactor, pan)
    );
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
          "",
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
            "",
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

  return ["", NewErrorKV("filterNodesAndLayers: unknown error", {})];
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
  layers: Array<Record<string, MapNode>>,
  nodeRecord: Record<string, NodeRecordItem>,
  currentNodeId: string
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
  const upperLayer: Record<string, MapNode> = {};
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
  const firstLayer: Record<string, MapNode> = {};
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
      if (nodeId != currentNodeId) {
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
  const secondLayer: Record<string, MapNode> = {};
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
  const thirdLayer: Record<string, MapNode> = {};
  for (const nodeId in secondLayer) {
    for (const child of nodeRecord[nodeId].node.children) {
      const [mapNode, _] = findMapNode(child.id, [layers[level + 3]]);
      if (mapNode == null || _ == null) {
        return [
          [],
          NewErrorKV("filterNodesAndLayers-thirdLayer:cannot findMapNode", {
            "child.id": child.id,
            level: level + 3,
            layers: [layers[level + 3]]
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
      node.border = zoomAndPanPolygon(node.border, zoom, pan);
    }
  }

  return layers;
}
