import { Point } from "@/types/graphics";

export type EventClick = {
  id: number;
};

export type EventDragging = {
  level: number;
  id: number;
  newCenter: Point;
};
