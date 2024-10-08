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
import { default as NewErrorKV } from "../tools/errorkv";
import { NodeRecordItem } from "@/store/tree";
import { polygonArea } from "d3-polygon";
import polygonClipping from "polygon-clipping";
import { clone, mod, round } from "../tools/utils";
import { findMapNode } from "../store/tree/helpers";
import api_const from "../../src/api/api_const";
import * as martinez from 'martinez-polygon-clipping';
import {Position} from "martinez-polygon-clipping";
import * as polybool from '@velipso/polybool';

const NORMALIZED_BORDER = [
  { x: 0, y: 0 },
  { x: 0, y: api_const.ST_HEIGHT },
  { x: api_const.ST_WIDTH, y: api_const.ST_HEIGHT },
  { x: api_const.ST_WIDTH, y: 0 }
];

export function getVectorLength(v: Vector): number {
  return Math.sqrt(
    Math.pow(v.from.x - v.to.x, 2) + Math.pow(v.from.y - v.to.y, 2)
  );
}

export function polygonToTurf(
  p: Polygon
): turf.Feature<turf.Polygon, turf.Properties> {
  if (!p) {
    throw new Error("polygonToTurf: p is empty");
  }
  const pp = p.map(point => [point.x, point.y]);
  pp.push([p[0].x, p[0].y]);
  let result = null
  try {
    result = turf.polygon([pp])
  } catch (e) {
    console.log(e, pp)
    throw e;
  }
  return result;
}

export function intersectPolybool(
  p1: Polygon,
  p2: Polygon
): [Polygon[] | null, ErrorKV] {
  const outerPolygon = <polybool.Point[]>[]
  for (const point of p1) {
    outerPolygon.push([point.x, point.y])
  }
  const clipPolygon = <polybool.Point[]>[]
  for (const point of p2) {
    clipPolygon.push([point.x, point.y])
  }
  const polyboolPolygon = polybool.default.intersect({regions:[clipPolygon], inverted:false}, {regions:[outerPolygon], inverted:false});
  if (!polyboolPolygon || !polyboolPolygon.regions || polyboolPolygon.regions.length === 0) {
    return [[], null]
  }
  const intersect = polyboolPolygon.regions[0]
  if (!intersect || intersect.length === 0) {
    return [[], null]
  }
  if (intersect.length < 3) {
    return [[], NewErrorKV("bad intersects",{"source":p1, "clip":p2})]
  }
  const result = [];
  for (const point of intersect) {
    result.push({x:point[0], y:point[1]})
  }
  return [[result], null]
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

export function intersectPC(
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

/**
 * You can play with martinez at https://codepen.io/w8r/pen/MjgqMx
 * @param p1
 * @param p2
 */
export function intersect(
  p1: Polygon,
  p2: Polygon
): [Polygon[] | null, ErrorKV] {
  const p1Arr = [];
  for (const p of p1) {
    p1Arr.push([p.x, p.y]);
  }
  p1Arr.push([p1[0].x, p1[0].y]);
  const gj1 = [ p1Arr ];

  const p2Arr = []
  for (const p of p2) {
    p2Arr.push([p.x, p.y]);
  }
  p2Arr.push([p2[0].x, p2[0].y]);
  const gj2 = [ p2Arr ]

  const polygonIntersect = martinez.intersection(gj2, gj1);
  if (polygonIntersect === null) {
    // no intersection
    return [[], null]
  }
  const resultPolys = [];
  for (const poly of polygonIntersect[0]) {
    const resultPoly = [];
    for (const p of poly ) {
      const p1 = p as Position
      resultPoly.push({ x: p1[0], y: p1[1] });
    }
    // удаляем последнюю точку если она совпадает с первой
    if(resultPoly[0].x === resultPoly[resultPoly.length-1].x && resultPoly[0].y === resultPoly[resultPoly.length-1].y) {
      resultPoly.pop();
    }
    resultPolys.push(resultPoly);
  }
  return [resultPolys as Polygon[], null]
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
          rightTop,
          cells
        })
      ];
    }
    const cellBorder = cell.geometry!.coordinates[0].map(p => ({
      x: p[0],
      y: p[1]
    }));
    cellBorder.pop(); // удаляем последнюю точку полигона потому что она всегда совпадает с первой
    cellMap[index] = cellBorder;
    index++;
  }

  return [cellMap, null];
}

/**
 * Point of polygon should be in clockwise or anticlockwise order
 * Otherwise it will not be convex
 * This function orders Points in a clockwise order
 * @param unorderedPoly
 */
export function orderConvexPolygonPoints(unorderedPoly: Polygon) {
  // find the lowest point
  let lowestLeftPoint = {x:0, y:Number.POSITIVE_INFINITY}
  for (const p of unorderedPoly) {
    if (p.y < lowestLeftPoint.y || (p.y === lowestLeftPoint.y && p.x < lowestLeftPoint.x)) {
      lowestLeftPoint = p
    }
  }

  // order by
  unorderedPoly.sort((a, b) => {
    return Math.atan2(a.y-lowestLeftPoint.y, a.x-lowestLeftPoint.x) - Math.atan2(b.y-lowestLeftPoint.y, b.x-lowestLeftPoint.x)
  })

  return unorderedPoly;
}

/**
 * Get voronoi cells with "centers" inside "outerBorder"
 * Current implementation uses turf.voronoi which can generate cells only in square border
 * Because of this we use intersect of cells for square with outerBorder polygon.
 * Intersect function works ugly and thus we ugly hack two different libraries for this.
 * More appropriate implementation would be
 * to use d3 delaunay voronoi implementation https://d3js.org/d3-delaunay/voronoi#delaunay_voronoi
 * because it can be used with any polygon like here https://github.com/Kcnarf/d3-voronoi-map
 *
 * Or try to use d3.geom.hull().clip()
 * as an intersection library like here https://stackoverflow.com/questions/21646822/clip-d3-voronoi-with-d3-hull
 * @param outerBorder
 * @param centers
 */
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
        err,
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

    let result = <Polygon[] | null>[]
    // мы хотим чтобы граница всех cell совпадала с outerBorder
 
    const [intersections, err] = intersectPolybool(cellMap[index], outerBorder);
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

    if (intersections.length === 0) {
      return [
        [],
        NewErrorKV("Voronoi cell has no intersection with outerBorder", {
          point: centers[index]
        })
      ];
    }
    
    result = intersections;

    res.push({
      border: result![0],
      center: centers[index]
    });
  }

  return [res, null];
}

// export function getVoronoiCellRecords(
//   outerBorder: Polygon, //(граница массива точек)
//   centers: Record<string, Point> //(точки внутри этой границы)
// ): [Record<string, Polygon>, ErrorKV] {
//   const result: Record<string, Polygon> = {};
//   const ids: string[] = [];
//   const centersArray: Point[] = [];
//   for (const id in centers) {
//     ids.push(id);
//     centersArray.push(centers[id]);
//   }
//
//   const [cells, err] = getVoronoiCells(outerBorder, centersArray);
//   if (err !== null) {
//     return [{}, err];
//   }
//   for (const i in ids) {
//     result[ids[i]] = cells[i].border;
//   }
//
//   return [result, null];
// }

export function polygonFill(
  selectedNodeId: string,
  currentNodeId: string,
  selectedNodePreconditionIds: string[]
): string {
  if (selectedNodeId && selectedNodeId == currentNodeId) {
    return "#f3afaf";
  }
  if (
    selectedNodePreconditionIds &&
    selectedNodePreconditionIds.indexOf(currentNodeId) != -1
  ) {
    return "#62f363";
  }
  return "transparent";
}

export function polygonFillOpacity(
  selectedNodeId: string,
  currentNodeId: string,
  selectedNodePreconditionIds: string[]
): string {
  if (selectedNodeId && selectedNodeId == currentNodeId) {
    return "0.2";
  }
  if (
    selectedNodePreconditionIds &&
    selectedNodePreconditionIds.indexOf(currentNodeId) != -1
  ) {
    return "0.2";
  }
  return "0";
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

export function NewEmptyVector(): Vector {
  return { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
}

export function getMaxDiagonal(polygon: Polygon): [Vector, ErrorKV] {
  if (!polygon || polygon.length < 3) {
    return [
      NewEmptyVector(),
      NewErrorKV("getMaxDiagonal: bad polygon", { polygon })
    ];
  }

  const diagonals: Vector[] = [];
  if (polygon.length == 3) {
    // triangle does not has diagonals, so me emulate them
    for (const i in polygon) {
      const middle = vectorOnNumber(
        {
          from: polygon[mod(Number(i) - 1, polygon.length)],
          to: polygon[mod(Number(i) + 1, polygon.length)]
        },
        1 / 2
      );
      diagonals.push({ from: polygon[i], to: middle.to });
    }
  } else {
    for (const i in polygon) {
      for (const j in polygon) {
        if (
          Number(j) != mod(Number(i) - 1, polygon.length) &&
          Number(j) != Number(i) &&
          Number(j) != mod(Number(i) + 1, polygon.length)
        ) {
          diagonals.push({ from: polygon[i], to: polygon[j] });
        }
      }
    }
  }

  let maxDiagonal = diagonals[0];
  for (const diag of diagonals) {
    if (getVectorLength(diag) > getVectorLength(maxDiagonal)) {
      maxDiagonal = diag;
    }
  }

  return [maxDiagonal, null];
}

export function polygonAsArray(poly: Polygon) {
  const parentMapNodeBorderArr = [];
  for (const point of poly) {
    parentMapNodeBorderArr.push([point.x, point.y])
  }
  return parentMapNodeBorderArr;
}

export function convertPosition(
  type: "normalize" | "denormalize",
  position: Point,
  parentID: string | null,
  mapNodeLayers: Array<Record<string, MapNode>>
): [Point | null, ErrorKV] {
  let convertedPosition: Point;
  if (parentID) {
    const [parentMapNode] = findMapNode(parentID, mapNodeLayers);
    if (!parentMapNode) {
      return [
        null,
        NewErrorKV("UPDATE_NODE: Cannot findMapNode", { id: parentID })
      ];
    }

    let morphedPositions: Record<string, Point> | null, err: ErrorKV;
    if (type === "denormalize") {
      if (!isInside(position, NORMALIZED_BORDER)) {
        return [
          null,
          NewErrorKV("convertPosition: position outside NORMALIZED_BORDER", {
            normalizedBorder: NORMALIZED_BORDER,
            position,
            parentID
          })
        ];
      }
      [morphedPositions, err] = morphChildrenPoints(
        NORMALIZED_BORDER,
        parentMapNode.border,
        { tmp: position }
      );
    } else {
      if (!isInside(position, parentMapNode.border)) {
        return [
          null,
          NewErrorKV("convertPosition: position outside parentMapNode.border", {
            "parentMapNode.border": parentMapNode.border,
            "parentMapNode.center": parentMapNode.center,
            position,
            parentID
          })
        ];
      }
      [morphedPositions, err] = morphChildrenPoints(
        parentMapNode.border,
        NORMALIZED_BORDER,
        { tmp: position }
      );
      if (err !== null) {
        return [
          null,
          NewErrorKV("UPDATE_NODE: Cannot morphChildrenPoints", {
            type: type,
            normalizedBorder: NORMALIZED_BORDER,
            parentID: parentID,
            "parentMapNode.border": parentMapNode.border,
            "dbNode.position": position
          })
        ];
      }
      // make sure that after normalization position is strictly inside border
      if (morphedPositions!["tmp"].x < 0) {
        morphedPositions!["tmp"].x = 1;
      }
      if (morphedPositions!["tmp"].x > api_const.ST_WIDTH) {
        morphedPositions!["tmp"].x = api_const.ST_WIDTH - 1;
      }
      if (morphedPositions!["tmp"].y < 0) {
        morphedPositions!["tmp"].y = 1;
      }
      if (morphedPositions!["tmp"].y > api_const.ST_HEIGHT) {
        morphedPositions!["tmp"].y = api_const.ST_HEIGHT - 1;
      }
    }
    if (err !== null) {
      return [
        null,
        NewErrorKV("UPDATE_NODE: Cannot morphChildrenPoints", {
          type: type,
          parentID: parentID,
          normalizedBorder: NORMALIZED_BORDER,
          "parentMapNode.border": parentMapNode.border,
          "parentMapNode.border as array": polygonAsArray(parentMapNode.border),
          "dbNode.position": position
        })
      ];
    }
    convertedPosition = morphedPositions!["tmp"];
  } else {
    if (type === "denormalize") {
      convertedPosition = { x: api_const.ROOT_CENTER_X, y: api_const.ROOT_CENTER_Y };
    } else {
      convertedPosition = { x: api_const.ST_WIDTH / 2, y: api_const.ST_HEIGHT / 2 };
    }
  }

  return [convertedPosition, null];
}

/**
 *
 * @param tree
 * @param rootBorder
 * @param rootPosition
 */
export function treeToMapNodeLayers(
  tree: Tree,
  rootBorder: Polygon,
  rootPosition: Point
): [Array<Record<string, MapNode>> | null, ErrorKV] {
  if (Object.keys(tree).length == 0) {
    return [[], null];
  }
  const treeLayers: Array<Array<Tree>> = [[tree]];
  const mapNodeLayers: Array<Record<string, MapNode>> = [
    {
      [tree.id]: {
        id: tree.id,
        border: rootBorder,
        title: tree.title,
        center: rootPosition
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

      // check that no two children have the same center
      const tmpMap = {} as Record<string, string>;
      let strPos = "";
      for (const i in treeNode.children) {
        strPos = JSON.stringify(treeNode.children[i].position);
        if (tmpMap[strPos] && tmpMap[strPos].length > 0) {
          return [
            null,
            NewErrorKV("two children has the same center", {
              firstId: tmpMap[strPos],
              secondId: treeNode.children[i].id
            })
          ];
        } else {
          tmpMap[strPos] = treeNode.children[i].id;
        }
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

      // denormalize positions
      const treeNodeChildren = clone(treeNode.children) as Array<Tree>;
      for (const child of treeNodeChildren) {
        const [denormalizedPosition, err] = convertPosition(
          "denormalize",
          child.position,
          treeNode.id,
          [lastMapNodeLayer]
        );
        if (err) {
          return [null, err];
        }
        child.position = denormalizedPosition!;
      }
      const [cells, error] = getVoronoiCells(
        lastMapNodeLayer[treeNode.id].border,
        treeNodeChildren.map(ch => ({ x: ch.position.x, y: ch.position.y }))
      );
      if (error != null) {
        return [null, NewErrorKV("error in getVoronoiCells", {error, "parent node id":treeNode.id})];
      }

      for (const cell of cells) {
        for (const child of treeNodeChildren) {
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

export function mergeMapNodeLayers(
  recipientLayers: Record<string, MapNode>[],
  insertedLayers: Record<string, MapNode>[],
  startFromLevel: number
): ErrorKV {
  if (startFromLevel >= recipientLayers.length || startFromLevel < 0) {
    return NewErrorKV(
      "startFromLevel >= recipientLayers.length or startFromLevel < 0",
      {
        startFromLevel,
        "recipientLayers.length": recipientLayers.length
      }
    );
  }
  let i = startFromLevel;
  while (i < startFromLevel + insertedLayers.length) {
    for (const id in insertedLayers[i - startFromLevel]) {
      recipientLayers[i][id] = insertedLayers[i - startFromLevel][id];
    }
    i++;
  }

  return null;
}
