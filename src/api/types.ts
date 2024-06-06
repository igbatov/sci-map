import { Point } from "@/types/graphics";

export type DBMapNode = {
  id: string;
  parentID: string;
  name: string;
  children: string[];
  position: Point;
};

export type DBImage = {
  name: string;
  path: string;
  url: string;
  removed: number;
};
