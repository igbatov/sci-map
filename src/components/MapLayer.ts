import {MapNode, Point} from "@/types/graphics";
import {Ref} from "vue";

export type TitleBox = {
  position: Point,
  bbox: {
    width: number,
    height: number,
  }
}

export const nodeToTitleBox = (nodes: Ref<Array<MapNode>>): Record<number, TitleBox> => {
  const titleBox: Record<number, TitleBox> = {}
  for(const i in nodes.value) {
    const node = nodes.value[i]
    titleBox[node.id] = {
      position: node.center,
      bbox: {
        width: 0,
        height: 0,
      }
    }
  }

  return titleBox
}
