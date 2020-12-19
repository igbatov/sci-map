import { Point, Polygon, VoronoiCell } from "@/types/graphics";
import { Delaunay } from "d3-delaunay";
import {Feature, polygon, Polygon as TurfPolygon} from "@turf/helpers"
import turf_intersect from "@turf/intersect"
import {ErrorKV} from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";

export function intersect(p1: Polygon, p2: Polygon): Polygon[] {
    const pp1 = p1.map(p => [p.x, p.y])
    pp1.push([p1[0].x, p1[0].y])
    let polygon1 = polygon([pp1]);

    const pp2 = p2.map(p => [p.x, p.y])
    pp2.push([p2[0].x, p2[0].y])
    let polygon2 = polygon([pp2]);

    let polygonIntersect = turf_intersect(polygon1, polygon2) as Feature<TurfPolygon>;

    const resultPolys = []
    if (polygonIntersect) {
        for (let poly of polygonIntersect.geometry.coordinates) {
            const resultPoly = []
            for (let p of poly) {
                resultPoly.push({x:p[0], y:p[1]})
            }
            // удаляем послднюю точку полигона потому что она всегда совпадает с первой
            resultPoly.pop()
            resultPolys.push(resultPoly)
        }

    }
    return resultPolys
}

export function getVoronoiCells(
    outerBorder: Polygon, //(граница массива точек)
    centers: Point[] //(точки внутри этой границы)
): [VoronoiCell[], ErrorKV] {
    const bb = getBoundingBorders(outerBorder)
    const cells = Delaunay
        .from(centers.map(p => [p.x, p.y]))
        .voronoi([bb[0].x, bb[0].y, bb[1].x, bb[1].y])
        .cellPolygons()

    const cellMap:{ [key: number]: Delaunay.Polygon } = {}
    for (let cell of cells) {
        cellMap[cell.index] = cell
    }

    const res = []
    for (let index in centers) {
        let cellBorder = cellMap[index].map(p => ({x:p[0], y:p[1]}))
        cellBorder.pop() // удаляем последную точку полигона потому что она всегда совпадает с первой
        const intersections = intersect(cellBorder, outerBorder) // мы хотим чтобы граница всех cell совпадала с outerBorder
        if (intersections == []) {
            return [
                [],
                NewErrorKV(
                "Voronoi cell has no intersection with outerBorder",
                [{"point": centers[index]}]
                )
            ]
        }
        if (intersections.length > 1) {
            return [
                [],
                NewErrorKV(
                    "Voronoi cell has more than one intersection with outerBorder",
                    [{"point": centers[index]}]
                )
            ]
        }
        res.push({
            border: intersections[0],
            center: centers[index],
        })
    }

    return [res, null];
}

// Возвращает левый нижний и правый верхний углы описанного вокруг Polygon квадрата
export function getBoundingBorders(border: Polygon): [Point, Point] {
    const minX = border.reduce((previousValue, currentValue) =>
        previousValue.x > currentValue.x ? currentValue : previousValue).x
    const minY = border.reduce((previousValue, currentValue) =>
        previousValue.y > currentValue.y ? currentValue : previousValue).y
    const maxX = border.reduce((previousValue, currentValue) =>
        previousValue.x < currentValue.x ? currentValue : previousValue).x
    const maxY = border.reduce((previousValue, currentValue) =>
        previousValue.y < currentValue.y ? currentValue : previousValue).y
    return [{x:minX, y:minY}, {x:maxX, y:maxY}]
}
