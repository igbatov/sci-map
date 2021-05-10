import {
  Tree,
  Point,
  Polygon,
  VoronoiCell,
  MapNode,
  Vector,
  Rectangle
} from "@/types/graphics";
import * as turf from "@turf/turf";
import { ErrorKV } from "@/types/errorkv";
import {default as NewErrorKV} from "../tools/errorkv";
import { NodeRecordItem } from "@/store/tree";
import { polygonArea } from "d3-polygon";
import polygonClipping from "polygon-clipping";
import {clone, round} from "../tools/utils";
import {findMapNode} from "@/store/tree/helpers";
import api from "@/api/api";

export function getVectorLength(v: Vector): number {
  return Math.sqrt(
    Math.pow(v.from.x - v.to.x, 2) + Math.pow(v.from.y - v.to.y, 2)
  );
}

export function polygonToTurf(
  p: Polygon
): turf.Feature<turf.Polygon, turf.Properties> {
  if (!p) {
    throw new Error("polygonToTurf: p is empty")
  }
  const pp = p.map(point => [point.x, point.y]);
  pp.push([p[0].x, p[0].y]);
  return turf.polygon([pp]);
}

export function isInside(point: Point, polygon: Polygon): boolean {
  return turf.booleanPointInPolygon(
    turf.point([point.x, point.y]),
    polygonToTurf(polygon)
  );
}

export function polygonToPCPolygon(p: Polygon): polygonClipping.Polygon {
  const pp = p.map(point => [point.x, point.y] as polygonClipping.Pair);
  pp.push([p[0].x, p[0].y]);
  return [pp];
}

export function area(p: Polygon): number {
  return Math.abs(polygonArea(p.map(point => [point.x, point.y])));
}

export function intersect(
  p1: Polygon,
  p2: Polygon
): [Polygon[] | null, ErrorKV] {
  // polygonClipping.intersection does not like digits after point
  // so we find the least multiplier that gives area > 1000 for polygon
  // and then round coordinates
  let np1: Polygon = clone(p1);
  let np2: Polygon = clone(p2);
  let cf = 1;
  while (area(np1) < 1000 && area(np2) < 1000) {
    cf = cf * 10;
    np1 = p1.map(p => ({ x: p.x * cf, y: p.y * cf }));
    np2 = p2.map(p => ({ x: p.x * cf, y: p.y * cf }));
  }
  np1 = np1.map(p => ({ x: round(p.x), y: round(p.y) }));
  np2 = np2.map(p => ({ x: round(p.x), y: round(p.y) }));

  const tp1 = polygonToPCPolygon(np1);
  const tp2 = polygonToPCPolygon(np2);
  if (tp1 == null || tp2 == null) {
    return [
      null,
      NewErrorKV("intersect: error in polygonToPCPolygon", { p1: p1, p2: p2 })
    ];
  }

  // polygonClipping.intersection
  const polygonIntersect = polygonClipping.intersection(tp1, tp2);
  if (polygonIntersect == null || !polygonIntersect.length) {
    return [[], null];
  }

  const resultPolys = [];

  for (const poly of polygonIntersect[0]) {
    const resultPoly = [];
    for (const p of poly) {
      resultPoly.push({ x: p[0] / cf, y: p[1] / cf });
    }
    // удаляем последнюю точку полигона потому что она всегда совпадает с первой
    resultPoly.pop();
    resultPolys.push(resultPoly);
  }

  return [resultPolys, null];
}

// Возвращает левый нижний и правый верхний углы описанного вокруг Polygon квадрата
export function getBoundingBorders(border: Polygon): Rectangle {
  if (!border) {
    console.error("bad border", border);
  }
  const minX = border.reduce((previousValue, currentValue) =>
    previousValue.x > currentValue.x ? currentValue : previousValue
  ).x;
  const minY = border.reduce((previousValue, currentValue) =>
    previousValue.y > currentValue.y ? currentValue : previousValue
  ).y;
  const maxX = border.reduce((previousValue, currentValue) =>
    previousValue.x < currentValue.x ? currentValue : previousValue
  ).x;
  const maxY = border.reduce((previousValue, currentValue) =>
    previousValue.y < currentValue.y ? currentValue : previousValue
  ).y;
  return {
    leftBottom: { x: minX, y: minY },
    rightTop: { x: maxX, y: maxY }
  };
}

export function getVoronoiCellsInSquare(
  centers: Point[],
  leftBottom: Point,
  rightTop: Point
): [Record<number, Polygon>, ErrorKV] {
  const turfPoints = centers.map(p => turf.point([p.x, p.y]));
  const collection = turf.featureCollection(turfPoints);
  const cells = turf.voronoi(collection, {
    bbox: [leftBottom.x, leftBottom.y, rightTop.x, rightTop.y]
  });
  const cellMap: Record<number, Polygon> = {};
  let index = 0;
  for (const cell of cells.features) {
    if (!cell) {
      return [
        {},
        NewErrorKV("getVoronoiCellsInSquare: undefined cell", {
          centers,
          leftBottom,
          rightTop
        })
      ];
    }
    const cellBorder = cell.geometry!.coordinates[0].map(p => ({
      x: p[0],
      y: p[1]
    }));
    cellBorder.pop(); // удаляем последную точку полигона потому что она всегда совпадает с первой
    cellMap[index] = cellBorder;
    index++;
  }

  return [cellMap, null];
}

export function getVoronoiCells(
  outerBorder: Polygon, //(граница массива точек)
  centers: Point[] //(точки внутри этой границы)
): [VoronoiCell[], ErrorKV] {
  if (!outerBorder) {
    return [
      [],
      NewErrorKV("getVoronoiCells: bad outerBorder", { outerBorder, centers })
    ];
  }
  const bb = getBoundingBorders(outerBorder);
  const [cellMap, err] = getVoronoiCellsInSquare(
    centers,
    bb.leftBottom,
    bb.rightTop
  );
  if (err) {
    return [
      [],
      NewErrorKV("getVoronoiCells: error in getVoronoiCellsInSquare", {
        bb,
        centers
      })
    ];
  }

  const res = [];
  for (const index in centers) {
    if (!cellMap[index]) {
      return [
        [],
        NewErrorKV("Cannot find index in cellMap", {
          index: index,
          centers: centers,
          cellMap: cellMap,
          BoundingBorders: bb,
          outerBorder
        })
      ];
    }

    const [intersections, err] = intersect(cellMap[index], outerBorder); // мы хотим чтобы граница всех cell совпадала с outerBorder
    if (intersections == null || err != null) {
      return [
        [],
        NewErrorKV("getVoronoiCells error", {
          err,
          cellBorder: cellMap[index],
          outerBorder
        })
      ];
    }

    if (intersections == []) {
      return [
        [],
        NewErrorKV("Voronoi cell has no intersection with outerBorder", {
          point: centers[index]
        })
      ];
    }
    if (intersections.length > 1) {
      return [
        [],
        NewErrorKV(
          "Voronoi cell has more than one intersection with outerBorder",
          { point: centers[index] }
        )
      ];
    }
    res.push({
      border: intersections[0],
      center: centers[index]
    });
  }

  return [res, null];
}

export function getVoronoiCellRecords(
  outerBorder: Polygon, //(граница массива точек)
  centers: Record<string, Point> //(точки внутри этой границы)
): [Record<string, Polygon>, ErrorKV] {
  const result: Record<string, Polygon> = {}
  const ids: string[] = []
  const centersArray: Point[] = []
  for (const id in centers) {
    ids.push(id)
    centersArray.push(centers[id])
  }

  const [cells, err] = getVoronoiCells(outerBorder, centersArray)
  if (err !== null) {
    return [{}, err]
  }
  for (const i in ids) {
    result[ids[i]] = cells[i].border
  }

  return [result, null]
}

export function polygonToPath(polygon: Polygon): string {
  return polygon.map((point: Point) => `${point.x} ${point.y}`).join(",");
}

export function treeToNodeRecord(tree: Tree): Record<number, NodeRecordItem> {
  const nodeRecord: Record<string, NodeRecordItem> = {};
  const stack: NodeRecordItem[] = [{ node: tree, parent: null }];
  while (stack.length) {
    const item = stack.pop();
    if (!item) {
      break;
    }
    nodeRecord[item.node.id] = item;
    stack.push(
      ...item.node.children.map(child => ({
        node: child,
        parent: item.node
      }))
    );
  }

  return nodeRecord;
}
export function treeToMapNodeLayers(
  tree: Tree
): [Array<Record<string, MapNode>> | null, ErrorKV] {
  if (Object.keys(tree).length == 0) {
    return [[], null];
  }
  const treeLayers: Array<Array<Tree>> = [[tree]];
  const mapNodeLayers: Array<Record<string, MapNode>> = [
    {
      0: {
        id: "0",
        border: [
          { x: 0, y: 0 },
          { x: 2 * tree.position.x, y: 0 },
          { x: 2 * tree.position.x, y: 2 * tree.position.y },
          { x: 0, y: 2 * tree.position.y }
        ],
        title: "",
        center: { x: tree.position.x, y: tree.position.y }
      }
    }
  ];
  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    const lastTreeLayer = treeLayers[treeLayers.length - 1];
    const lastMapNodeLayer = mapNodeLayers[treeLayers.length - 1];
    const newTreeLayer = [];
    const newMapNodeLayer: Record<string, MapNode> = {};
    for (const treeNode of lastTreeLayer) {
      if (!treeNode.children) {
        return [
          null,
          NewErrorKV("treeToMapNodeLayers: treeNode with children undefined", {
            treeNode
          })
        ];
      }
      if (!treeNode.children.length) {
        continue;
      }
      newTreeLayer.push(...treeNode.children);
      if (!lastMapNodeLayer[treeNode.id]) {
        return [
          null,
          NewErrorKV("Cannot find node in mapNodeLayers", {
            layer: mapNodeLayers[mapNodeLayers.length - 1],
            treeNode: treeNode
          })
        ];
      }

      // check that node's children positions lay inside node's border
      for (const child of treeNode.children) {
        if (!isInside(child.position, lastMapNodeLayer[treeNode.id].border)) {
          return [
            null,
            NewErrorKV(
              "treeToMapNodeLayers: children position outside parent's border",
              {
                "treeNode.title": treeNode.title,
                "treeNode.id": treeNode.id,
                border: lastMapNodeLayer[treeNode.id].border,
                "child.position": child.position
              }
            )
          ];
        }
      }
      const [cells, error] = getVoronoiCells(
        lastMapNodeLayer[treeNode.id].border,
        treeNode.children.map(ch => ({ x: ch.position.x, y: ch.position.y }))
      );
      if (error != null) {
        return [null, error];
      }

      for (const cell of cells) {
        for (const child of treeNode.children) {
          if (
            child.position.x == cell.center.x &&
            child.position.y == cell.center.y
          ) {
            newMapNodeLayer[child.id] = {
              id: child.id,
              title: child.title,
              center: child.position,
              border: cell.border
            };
          }
        }
      }
    }

    if (newTreeLayer.length) {
      treeLayers.push(newTreeLayer);
      mapNodeLayers.push(newMapNodeLayer);
    } else {
      return [mapNodeLayers, null];
    }
  }
}

export function transferToPoint(vector: Vector, point: Point): Vector {
  return {
    from: {
      x: point.x,
      y: point.y
    },
    to: {
      x: point.x + (vector.to.x - vector.from.x),
      y: point.y + (vector.to.y - vector.from.y)
    }
  };
}

export function pointToVector(p: Point): Vector {
  return { from: { x: 0, y: 0 }, to: p };
}

export function addVector(a: Vector, b: Vector): Vector {
  const bTransferred = transferToPoint(b, a.to);
  return {
    from: { x: a.from.x, y: a.from.y },
    to: { x: bTransferred.to.x, y: bTransferred.to.y }
  };
}

export function subtractVector(a: Vector, b: Vector): Vector {
  return transferToPoint(
    addVector(
      { from: { x: b.from.x, y: b.from.y }, to: { x: -b.to.x, y: -b.to.y } },
      a
    ),
    transferToPoint(b, a.from).to
  );
}

export function vectorOnNumber(a: Vector, c: number): Vector {
  const aTr = transferToPoint(a, { x: 0, y: 0 });
  return transferToPoint(
    { from: { x: 0, y: 0 }, to: { x: aTr.to.x * c, y: aTr.to.y * c } },
    a.from
  );
}

export function getRectangleCenter(s: Rectangle): Point {
  const diagonal = subtractVector(
    pointToVector(s.rightTop),
    pointToVector(s.leftBottom)
  );
  return vectorOnNumber(diagonal, 1 / 2).to;
}

export function transferPointOnVector(p: Point, v: Vector): Point {
  return transferToPoint(v, p).to;
}

// math: https://web.archive.org/web/20060911055655/http://local.wasp.uwa.edu.au/~pbourke/geometry/lineline2d/
export function getVectorIntersection(v1: Vector, v2: Vector): Point | null {
  const x1 = v1.from.x;
  const y1 = v1.from.y;
  const x2 = v1.to.x;
  const y2 = v1.to.y;
  const x3 = v2.from.x;
  const y3 = v2.from.y;
  const x4 = v2.to.x;
  const y4 = v2.to.y;
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  const numeA = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const numeB = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

  if (denom == 0) {
    return null;
  }

  const uA = numeA / denom;
  const uB = numeB / denom;

  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    return {
      x: x1 + uA * (x2 - x1),
      y: y1 + uA * (y2 - y1)
    };
  }

  return null;
}

export function convertPosition(
  type: "normalize" | "denormalize",
  position: Point, parentID: string | null,
  mapNodeLayers: Array<Record<string, MapNode>>
): [Point | null, ErrorKV] {
  let convertedPosition: Point
  if (parentID) {
    const [parentMapNode] = findMapNode(parentID, mapNodeLayers)
    if (!parentMapNode) {
      return [null, NewErrorKV("UPDATE_NODE: Cannot findMapNode", {"id":parentID})]
    }
    const normalizedBorder = [{x:0, y:0}, {x:0, y:api.ST_HEIGHT}, {x:api.ST_WIDTH, y:api.ST_HEIGHT}, {x:api.ST_WIDTH, y:0}]
    let morphedPositions: Record<string, Point> | null, err: ErrorKV
    if (type === "denormalize") {
        [morphedPositions, err] = morphChildrenPoints(
        normalizedBorder,
        parentMapNode.border,
        {"tmp": position}
      )
    } else {
      [morphedPositions, err] = morphChildrenPoints(
        parentMapNode.border,
        normalizedBorder,
        {"tmp": position}
      )
    }
    if (err !== null) {
      return [null, NewErrorKV("UPDATE_NODE: Cannot morphChildrenPoints", {
        "type": type,
        "normalizedBorder": normalizedBorder,
        "parentMapNode.border":parentMapNode.border,
        "dbNode.position": position
      })]
    }
    convertedPosition = morphedPositions!["tmp"]
  } else {
    if (type === "denormalize") {
      convertedPosition = {x: api.ROOT_WIDTH/2, y:api.ROOT_HEIGHT/2}
    } else {
      convertedPosition = {x: api.ST_WIDTH/2, y:api.ST_HEIGHT/2}
    }
  }

  return [convertedPosition, null]
}

export function morphChildrenPoints(
  oldBorder: Polygon,
  newBorder: Polygon,
  oldPoints: Record<string, Point>
): [Record<string, Point> | null, ErrorKV] {
  const oldCenterTf = turf.centerOfMass(polygonToTurf(oldBorder)).geometry;
  if (oldCenterTf == null) {
    return [
      null,
      NewErrorKV("morphChildrenPoints oldBorder centerOfMass error", {
        oldBorder: oldBorder,
        oldPoints: oldPoints
      })
    ];
  }
  const newCenterTf = turf.centerOfMass(polygonToTurf(newBorder)).geometry;
  if (newCenterTf == null) {
    return [
      null,
      NewErrorKV("morphChildrenPoints newBorder centerOfMass error", {
        newBorder: newBorder,
        oldPoints: oldPoints
      })
    ];
  }
  const oldCenter = {
    x: oldCenterTf.coordinates[0],
    y: oldCenterTf.coordinates[1]
  };
  const newCenter = {
    x: newCenterTf.coordinates[0],
    y: newCenterTf.coordinates[1]
  };

  // Move old node and its children to new node center
  oldBorder = oldBorder.map(
    (p): Point => {
      return transferPointOnVector(p, { from: oldCenter, to: newCenter });
    }
  );
  for (const id in oldPoints) {
    oldPoints[id] = transferPointOnVector(oldPoints[id], {
      from: oldCenter,
      to: newCenter
    });
  }

  // morph children
  const maxDiameter = Math.max(
    getVectorLength({
      from: getBoundingBorders(oldBorder).leftBottom,
      to: getBoundingBorders(oldBorder).rightTop
    }),
    getVectorLength({
      from: getBoundingBorders(newBorder).leftBottom,
      to: getBoundingBorders(newBorder).rightTop
    })
  );

  const newPoints: Record<string, Point> = {};
  for (const id in oldPoints) {
    const oldPoint = oldPoints[id];
    if (newCenter.x == oldPoint.x && newCenter.y == oldPoint.y) {
      newPoints[id] = oldPoint;
      continue;
    }
    let centerToPoint = { from: newCenter, to: oldPoints[id] };
    // enlarge it to guarantee intersect with both newBorder and oldBorder (transferred to newBorder center)
    centerToPoint = vectorOnNumber(
      centerToPoint,
      maxDiameter / getVectorLength(centerToPoint)
    );
    let oldBorderIntersection = null;
    for (const i in oldBorder) {
      const segment = {
        from: oldBorder[i],
        to: oldBorder[(Number(i) + 1) % oldBorder.length]
      };
      const p = getVectorIntersection(centerToPoint, segment);
      if (p != null) {
        oldBorderIntersection = p;
        break;
      }
    }
    if (oldBorderIntersection == null) {
      return [
        null,
        NewErrorKV(
          "morphChildrenPoints cannot find intersection with oldBorder",
          {
            centerToPoint: centerToPoint,
            oldBorder: oldBorder
          }
        )
      ];
    }

    let newBorderIntersection = null;
    for (const i in newBorder) {
      const segment = {
        from: newBorder[i],
        to: newBorder[(Number(i) + 1) % newBorder.length]
      };
      const p = getVectorIntersection(centerToPoint, segment);
      if (p != null) {
        newBorderIntersection = p;
        break;
      }
    }
    if (newBorderIntersection == null) {
      return [
        null,
        NewErrorKV(
          "morphChildrenPoints cannot find intersection with newBorder",
          {
            centerToPoint: centerToPoint,
            newBorder: newBorder
          }
        )
      ];
    }

    if (
      oldBorderIntersection.x == newBorderIntersection.x &&
      oldBorderIntersection.y == newBorderIntersection.y
    ) {
      newPoints[id] = oldPoint;
      continue;
    }

    const coeff =
      getVectorLength({ from: newCenter, to: newBorderIntersection }) /
      getVectorLength({ from: newCenter, to: oldBorderIntersection });
    newPoints[id] = vectorOnNumber({ from: newCenter, to: oldPoint }, coeff).to;
  }

  return [newPoints, null];
}

export function getMaxDiagonal(polygon: Polygon): Vector {
  const diagonals = polygon.reduce((res, p) => {
    res.push(...polygon.map(v => ({ from: p, to: v })));
    return res;
  }, [] as Array<Vector>);

  let maxDiagonal = diagonals[0];
  for (const diag of diagonals) {
    if (getVectorLength(diag) > getVectorLength(maxDiagonal)) {
      maxDiagonal = diag;
    }
  }

  return maxDiagonal;
}
