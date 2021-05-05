import {Point} from "@/types/graphics";

export type DBNode = {
  id: string,
  parentID: string,
  name: string,
  children: string[],
  position: Point,
}
