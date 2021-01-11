export interface Point {
  x: number;
  y: number;
}

export type Polygon = Array<Point>;
export type Rectangle = {
  leftBottom: Point;
  rightTop: Point;
};
export type Vector = {
  from: Point;
  to: Point;
};
export type VoronoiCell = {
  border: Polygon;
  center: Point;
};

export type MapNode = {
  id: number;
  title: string;
  center: Point;
  border: Polygon;
};

export type TreeNodeResource = {
  type: string;
  author: string;
  name: string;
  link: string;
  rate: number;
};

export type Tree = {
  id: number;
  title: string;
  position: Point;
  wikipedia: string;
  // список книг, статей, курсов по этой теме
  resources: Array<TreeNodeResource>;
  children: Array<Tree>;
};
