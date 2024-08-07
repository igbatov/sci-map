import { MapNode, Point, Polygon, Viewport } from "@/types/graphics";
import { area, getVectorLength, isInside } from "@/tools/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
import { NodeRecordItem } from "@/store/tree";
import { findMapNode } from "@/store/tree/helpers";
import { clone } from "@/tools/utils";
import { isWideScreen } from "@/components/helpers";
import {mutations as zoomPanMutations, State} from "@/store/zoom_pan";
import api from "@/api/api";
import {Store} from "vuex";
import api_const from "@/api/api_const";

const MIN_VISIBLE_NODES_NUM = isWideScreen() ? 3 : 1;

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

export function zoomAndPanPointInPlace(
  p: Point,
  newZoom: number,
  oldZoom: number,
  newPan: Point,
  oldPan: Point
) {
  p.x = ((p.x - oldPan.x) / oldZoom) * newZoom + newPan.x;
  p.y = ((p.y - oldPan.y) / oldZoom) * newZoom + newPan.y;
}

export function zoomAndPanPolygonInPlace(
  p: Polygon,
  newZoom: number,
  oldZoom: number,
  newPan: Point,
  oldPan: Point
) {
  p.forEach(point =>
    zoomAndPanPointInPlace(point, newZoom, oldZoom, newPan, oldPan)
  );
}

/**
 * CentralNode вычисляется следующим образом.
 * Начинаем смотреть с самого верхнего слоя.
 * Для каждого узла слоя применяем zoomFactor, затем pan
 * Потом смотрим находиться ли focusPoint внутри него.
 * Если да, то это претендент на currentNode (назовем его currentNodePretender).
 * Мы берем его полную площадь и умножаем на MIN_VISIBLE_NODES_NUM.
 * Если получившееся значение ≤ площади экрана, то мы считаем что currentNode это parent узла currentNodePretender
 * Если больше, то повторяем итерацию, но только с детьми currentNodePretender.
 * @param layers
 * @param nodeRecord
 * @param viewport
 * @param zoomFactor
 * @param pan
 * @param focusPoint
 */
export function findCentralNode(
  layers: Array<Record<string, MapNode>>,
  nodeRecord: Record<string, NodeRecordItem>,
  viewport: Viewport,
  zoomFactor: number,
  pan: Point,
  focusPoint: Point
): [string, ErrorKV] {
  if (!layers || layers.length == 0) {
    return ["", null];
  }

  let underFocusPointNodeId = null;
  const viewportArea = viewport.width * viewport.height;
  let nodesToCheck = layers[0];
  while (Object.keys(nodesToCheck).length) {
    underFocusPointNodeId = "";

    for (const nodeId in nodesToCheck) {
      const borderToCheck = zoomAndPanPolygon(
        nodesToCheck[nodeId].border,
        zoomFactor,
        pan
      );
      if (isInside(focusPoint, borderToCheck)) {
        underFocusPointNodeId = nodeId;
        break;
      }
    }

    if (underFocusPointNodeId === "") {
      // if focusPoint is outside a map, take the closest node
      let minDist = Infinity;
      for (const nodeId in nodesToCheck) {
        const nodeCenter = zoomAndPanPoint(
          nodesToCheck[nodeId].center,
          zoomFactor,
          pan
        );
        const dist = getVectorLength({ from: nodeCenter, to: focusPoint });
        if (dist < minDist) {
          minDist = dist;
          underFocusPointNodeId = nodeId;
        }
      }
    }

    const underCursorNodeArea = area(
      zoomAndPanPolygon(
        nodesToCheck[underFocusPointNodeId].border,
        zoomFactor,
        pan
      )
    );
    if (
      Math.floor(underCursorNodeArea) * MIN_VISIBLE_NODES_NUM <=
      Math.floor(viewportArea)
    ) {
      if (nodeRecord[underFocusPointNodeId].parent == null) {
        return [underFocusPointNodeId, null];
      }
      return [nodeRecord[underFocusPointNodeId].parent!.id, null];
    } else {
      nodesToCheck = {};
      if (!nodeRecord[underFocusPointNodeId]) {
        return [
          "",
          NewErrorKV(
            "findCurrentNode: cannot find underFocusPointNodeId in nodeRecord",
            { maxIntersectNodeId: underFocusPointNodeId, nodeRecord }
          )
        ];
      }
      for (const child of nodeRecord[underFocusPointNodeId].node.children) {
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
        return [underFocusPointNodeId, null];
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
      const [mapNode, l] = findMapNode(child.id, [layers[level]]);
      if (mapNode == null || l === null) {
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
      const [mapNode, l] = findMapNode(child.id, [layers[level + 1]]);
      if (mapNode == null || l === null) {
        return [
          [],
          NewErrorKV("filterNodesAndLayers-firstLayer: error in findMapNode", {
            "child.id": child.id,
            layers: [layers[level + 1]]
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
      const [mapNode, l] = findMapNode(childOfChild.id, [layers[level + 2]]);
      if (mapNode == null || l === null) {
        return [
          [],
          NewErrorKV("filterNodesAndLayers-secondLayer: error in findMapNode", {
            "child.id": child.id,
            layers: [layers[level + 2]]
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
      const [mapNode, l] = findMapNode(child.id, [layers[level + 3]]);
      if (mapNode == null || l === null) {
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

export function zoomAnPanLayersInPlace(
  layers: Array<Record<number, MapNode>>,
  newZoom: number,
  newPan: Point,
  oldZoom: number,
  oldPan: Point
) {
  if (!layers || layers.length == 0) {
    return [];
  }
  for (const idx in layers) {
    const layer = {} as Record<number, MapNode>;
    for (const id in layers[idx]) {
      zoomAndPanPointInPlace(
        layers[idx][id].center,
        newZoom,
        oldZoom,
        newPan,
        oldPan
      );
      zoomAndPanPolygonInPlace(
        layers[idx][id].border,
        newZoom,
        oldZoom,
        newPan,
        oldPan
      );
    }
  }
}

export function zoomAnPanLayers(
  layers: Array<Record<number, MapNode>>,
  zoom: number,
  pan: Point
): Array<Record<number, MapNode>> {
  if (!layers || layers.length == 0) {
    return [];
  }
  const resultLayers = [] as Array<Record<number, MapNode>>;
  for (const idx in layers) {
    const layer = {} as Record<number, MapNode>;
    for (const id in layers[idx]) {
      const node = layers[idx][id];
      layer[id] = {
        id: node.id,
        title: node.title,
        center: zoomAndPanPoint(node.center, zoom, pan),
        border: zoomAndPanPolygon(node.border, zoom, pan)
      };
    }
    resultLayers.push(layer);
  }

  return resultLayers;
}

export function zoomAndPanToNode(
  toNode: MapNode,
  viewport: Viewport,
  zoomPanState: State,
  store: Store<any>,
) {
  const initial = clone(toNode.center);
  const zoomCf = Math.sqrt(
    (viewport.width*viewport.height)/((MIN_VISIBLE_NODES_NUM-0.01)*area(toNode.border))
  );
  store.commit(
    `zoomPan/${zoomPanMutations.ADD_ZOOM}`,
    zoomCf,
  );
  const after = {
    x: initial.x * zoomPanState.zoom + zoomPanState.pan.x,
    y: initial.y * zoomPanState.zoom + zoomPanState.pan.y
  };
  store.commit(`zoomPan/${zoomPanMutations.ADD_PAN}`, {
    from: after,
    to: {x:api_const.ROOT_CENTER_X, y:api_const.ROOT_CENTER_Y},
  });
}
