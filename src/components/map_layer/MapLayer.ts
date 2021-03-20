import { MapNode, Point } from "@/types/graphics";
import {nextTick, ref, Ref, watch} from "vue";

export type EventClickNode = {
  id: number;
};

export type EventDraggingNode = {
  nodeId: number;
  delta: Point;
};

export type MouseDownInfo = {
  nodeId: number | null;
  dragStart: boolean;
}

type emitFn = (event: "node-mouse-down" | "background-mouse-down" | "dragging" | "drop" | "click", ...args: any[]) => void

type TitleBox = {
  position: Point;
  bbox: {
    width: number;
    height: number;
  };
};

export const mouseDownListener = (
  emit: emitFn,
  event: MouseEvent,
  titleBox: Ref<Record<number, TitleBox>>,
  mouseDownInfo: MouseDownInfo,
) => {
  let nodeFound = false;
  for (const id in titleBox.value) {
    const { x, y } = titleBox.value[id].position;
    const { width, height } = titleBox.value[id].bbox;
    if (
      event.clientX >= x &&
      event.clientX <= x + width &&
      event.clientY >= y - height &&
      event.clientY <= y
    ) {
      emit("node-mouse-down", { id: Number(id) });
      mouseDownInfo.nodeId = Number(id)
      mouseDownInfo.dragStart = false
      nodeFound = true;
      break;
    }
  }

  if (!nodeFound) {
    emit("background-mouse-down", {});
  }
};

export const mouseMoveListener = (emit: emitFn, event: MouseEvent, mouseDownInfo: MouseDownInfo) => {
  if (mouseDownInfo.nodeId) {
    mouseDownInfo.dragStart = true;
    emit("dragging", {
      nodeId: mouseDownInfo.nodeId,
      delta: {
        x: event.movementX,
        y: event.movementY
      }
    });
  }
};

export const mouseUpListener = (emit: emitFn, mouseDownInfo: MouseDownInfo) => {
  if (mouseDownInfo.nodeId) {
    if (mouseDownInfo.dragStart) {
      emit("drop", { id: mouseDownInfo.nodeId });
    } else {
      emit("click", { id: mouseDownInfo.nodeId });
    }
    mouseDownInfo.dragStart = false;
    mouseDownInfo.nodeId = null;
  }
};

export const nodeToTitleBox = (
  nodes: Array<MapNode>
): Record<number, TitleBox> => {
  const titleBox: Record<number, TitleBox> = {};
  for (const i in nodes) {
    const node = nodes[i];
    titleBox[node.id] = {
      position: node.center,
      bbox: {
        width: 0,
        height: 0
      }
    };
  }

  return titleBox;
};

const updateTitleBox = (mapNodes: Array<MapNode>, titleBox: Record<number, TitleBox>) => {
  // Code that will run only after the entire view has been rendered
  nextTick(() => {
    // clean previous version
    for (const i in titleBox) {
      delete titleBox[i];
    }
    // fill new ones
    for (const i in mapNodes) {
      const node = mapNodes[i];
      const dom = document.getElementById(`title_${node.id}`);
      if (dom == null) {
        continue;
      }
      titleBox[node.id] = {
        position: {
          x: node.center.x - dom.getBoundingClientRect().width / 2,
          y: node.center.y + dom.getBoundingClientRect().height / 4
        },
        bbox: {
          width: dom.getBoundingClientRect().width,
          height: 1.2 * dom.getBoundingClientRect().height // 1.2 to make title box a little bit taller
        }
      };
    }
  });
};

export const getTitleBoxes = (mapNodes: Ref<Array<MapNode>>): Ref<Record<number, TitleBox>> => {
  const titleBox = ref(nodeToTitleBox(mapNodes.value));
  /**
   * Update titleBox on every prop change after DOM rerender
   */
  watch(
    mapNodes,
    mps => updateTitleBox(mps, titleBox.value),
    {
      immediate: true
    }
  );

  return titleBox
}
