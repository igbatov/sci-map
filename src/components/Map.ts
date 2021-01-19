import { Point } from "@/types/graphics";

export type EventDragging = {
  level: number;
  id: number;
  newCenter: Point;
};
