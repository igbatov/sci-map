import {
  Tree,
  Point,
  Polygon,
  VoronoiCell,
  MapNode,
  Vector,
  Rectangle
} from "@/types/graphics";
import { Delaunay } from "d3-delaunay";
import * as turf from "@turf/turf";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";

export function polygonToTurf(
  p: Polygon
): turf.Feature<turf.Polygon, turf.Properties> {
  const pp = p.map(point => [point.x, point.y]);
  pp.push([p[0].x, p[0].y]);
  return turf.polygon([pp]);
}

export function intersect(
  p1: Polygon,
  p2: Polygon
): [Polygon[] | null, ErrorKV] {
  const tp1 = polygonToTurf(p1);
  const tp2 = polygonToTurf(p2);
  if (tp1 == null || tp2 == null) {
    return [
      null,
      NewErrorKV("intersect: error in polygonToTurf", { p1: p1, p2: p2 })
    ];
  }
  const polygonIntersect = turf.intersect(tp1, tp2) as turf.Feature<
    turf.Polygon
  >;

  const resultPolys = [];
  if (polygonIntersect == null || polygonIntersect.geometry == null) {
    return [
      null,
      NewErrorKV("intersect: error in turf.intersect", { p1: p1, p2: p2 })
    ];
  }

  for (const poly of polygonIntersect.geometry.coordinates) {
    const resultPoly = [];
    for (const p of poly) {
      resultPoly.push({ x: p[0], y: p[1] });
    }
    // удаляем послднюю точку полигона потому что она всегда совпадает с первой
    resultPoly.pop();
    resultPolys.push(resultPoly);
  }

  return [resultPolys, null];
}

// Возвращает левый нижний и правый верхний углы описанного вокруг Polygon квадрата
export function getBoundingBorders(border: Polygon): Rectangle {
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

export function getVoronoiCells(
  outerBorder: Polygon, //(граница массива точек)
  centers: Point[] //(точки внутри этой границы)
): [VoronoiCell[], ErrorKV] {
  const bb = getBoundingBorders(outerBorder);
  const cells = Delaunay.from(centers.map(p => [p.x, p.y]))
    .voronoi([bb.leftBottom.x, bb.leftBottom.y, bb.rightTop.x, bb.rightTop.y])
    .cellPolygons();

  const cellMap: { [key: number]: Delaunay.Polygon } = {};
  for (const cell of cells) {
    cellMap[cell.index] = cell;
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
          BoundingBorders: bb
        })
      ];
    }
    const cellBorder = cellMap[index].map(p => ({ x: p[0], y: p[1] }));
    cellBorder.pop(); // удаляем последную точку полигона потому что она всегда совпадает с первой
    const [intersections, err] = intersect(cellBorder, outerBorder); // мы хотим чтобы граница всех cell совпадала с outerBorder
    if (intersections == null || err != null) {
      return [[], NewErrorKV("getVoronoiCells error", { err: err })];
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

export function polygonToPath(polygon: Polygon): string {
  return polygon.map((point: Point) => `${point.x} ${point.y}`).join(",");
}

export function treeToMapNodeLayers(
  tree: Tree
): [Array<Record<number, MapNode>> | null, ErrorKV] {
  if (Object.keys(tree).length == 0) {
    return [[], null];
  }
  const treeLayers: Array<Array<Tree>> = [[tree]];
  const mapNodeLayers: Array<Record<number, MapNode>> = [
    {
      0: {
        id: 0,
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
    const newMapNodeLayer: Record<number, MapNode> = {};
    for (const treeNode of lastTreeLayer) {
      if (!treeNode.children) {
        return [
          null,
          NewErrorKV("treeToMapNodeLayers: treeNode without children", {
            treeNode
          })
        ];
      }
      if (!treeNode.children.length) {
        continue;
      }
      newTreeLayer.push(...treeNode.children);
      if (!lastMapNodeLayer[treeNode.id]) {
        console.log(mapNodeLayers[mapNodeLayers.length - 1], treeNode);
        return [
          null,
          NewErrorKV("Cannot find node in mapNodeLayers", {
            layer: mapNodeLayers[mapNodeLayers.length - 1],
            treeNode: treeNode
          })
        ];
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
      return [mapNodeLayers.reverse(), null];
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

export function getVectorLength(v: Vector): number {
  return Math.sqrt(
    Math.pow(v.from.x - v.to.x, 2) + Math.pow(v.from.y - v.to.y, 2)
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
  oldPoints: Record<number, Point>
): [Record<number, Point> | null, ErrorKV] {
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

  const newPoints: Record<number, Point> = {};
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
