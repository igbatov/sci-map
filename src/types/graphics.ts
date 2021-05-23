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
  id: string;
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
  id: string;
  title: string;
  position: Point;
  children: Array<Tree>;
};

export type TreeSkeleton = {
  id: string;
  title?: string;
  position?: Point;
  children?: Array<TreeSkeleton>;
};

export type Viewport = {
  width: number;
  height: number;
};
