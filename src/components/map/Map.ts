import { Point } from "@/types/graphics";

export type EventClickNode = {
  id: string;
};

export type EventDraggingNode = {
  id: string;
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
