import { MapNode } from "@/types/graphics";

export function findMapNode(
  id: number,
  mapNodeLayers: Array<Record<number, MapNode>>
): [MapNode | null, number | null] {
  for (const layer of mapNodeLayers) {
    if (layer[id]) {
      return [layer[id], id];
    }
  }

  return [null, null];
}
