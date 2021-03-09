import { Point } from "@/types/graphics";

export type EventClickNode = {
  id: number;
};

export type EventDraggingNode = {
  id: number;
  delta: Point;
};

export type EventDraggingBackground = {
  from: Point;
  to: Point;
};

export type EventWheel = {
  delta: number;
  center: Point;
};
