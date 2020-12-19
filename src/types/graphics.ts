export interface Point {
  x: number;
  y: number;
}

export type Polygon = Array<Point>;
export type Square = [Point, Point, Point, Point];
export type VoronoiCell = {
    border: Polygon,
    center: Point,
};
