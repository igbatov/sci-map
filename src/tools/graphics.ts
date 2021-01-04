import { Tree, Point, Polygon, VoronoiCell, MapNode } from "@/types/graphics";
import { Delaunay } from "d3-delaunay";
import { Feature, polygon, Polygon as TurfPolygon } from "@turf/helpers";
import turfIntersect from "@turf/intersect";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";

export function intersect(p1: Polygon, p2: Polygon): Polygon[] {
  const pp1 = p1.map(p => [p.x, p.y]);
  pp1.push([p1[0].x, p1[0].y]);
  const polygon1 = polygon([pp1]);

  const pp2 = p2.map(p => [p.x, p.y]);
  pp2.push([p2[0].x, p2[0].y]);
  const polygon2 = polygon([pp2]);

  const polygonIntersect = turfIntersect(polygon1, polygon2) as Feature<
    TurfPolygon
  >;

  const resultPolys = [];
  if (polygonIntersect) {
    for (const poly of polygonIntersect.geometry.coordinates) {
      const resultPoly = [];
      for (const p of poly) {
        resultPoly.push({ x: p[0], y: p[1] });
      }
      // удаляем послднюю точку полигона потому что она всегда совпадает с первой
      resultPoly.pop();
      resultPolys.push(resultPoly);
    }
  }
  return resultPolys;
}

// Возвращает левый нижний и правый верхний углы описанного вокруг Polygon квадрата
export function getBoundingBorders(border: Polygon): [Point, Point] {
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
  return [
    { x: minX, y: minY },
    { x: maxX, y: maxY }
  ];
}

export function getVoronoiCells(
  outerBorder: Polygon, //(граница массива точек)
  centers: Point[] //(точки внутри этой границы)
): [VoronoiCell[], ErrorKV] {
  const bb = getBoundingBorders(outerBorder);
  const cells = Delaunay.from(centers.map(p => [p.x, p.y]))
    .voronoi([bb[0].x, bb[0].y, bb[1].x, bb[1].y])
    .cellPolygons();

  const cellMap: { [key: number]: Delaunay.Polygon } = {};
  for (const cell of cells) {
    cellMap[cell.index] = cell;
  }

  const res = [];
  for (const index in centers) {
    const cellBorder = cellMap[index].map(p => ({ x: p[0], y: p[1] }));
    cellBorder.pop(); // удаляем последную точку полигона потому что она всегда совпадает с первой
    const intersections = intersect(cellBorder, outerBorder); // мы хотим чтобы граница всех cell совпадала с outerBorder
    if (intersections == []) {
      return [
        [],
        NewErrorKV("Voronoi cell has no intersection with outerBorder", [
          { point: centers[index] }
        ])
      ];
    }
    if (intersections.length > 1) {
      return [
        [],
        NewErrorKV(
          "Voronoi cell has more than one intersection with outerBorder",
          [{ point: centers[index] }]
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

export function mapToLayers(
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
          NewErrorKV("mapToLayers: treeNode without children", [{ treeNode }])
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
          NewErrorKV("Cannot find node in mapNodeLayers", [
            {
              layer: mapNodeLayers[mapNodeLayers.length - 1],
              treeNode: treeNode
            }
          ])
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
      return [mapNodeLayers, null];
    }
  }
}
