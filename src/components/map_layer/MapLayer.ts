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
  nodeId: string | null;
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
      event.clientY >= y  &&
      event.clientY <= y + height
    ) {
      emit("node-mouse-down", { id: id });
      mouseDownInfo.nodeId = id
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
): Record<string, TitleBox> => {
  const titleBox: Record<string, TitleBox> = {};
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

const updateTitleBox = (
  titleIdPrefix: string,
  position: "center" | "left",
  mapNodes: Array<MapNode>,
  titleBox: Record<string, TitleBox>
) => {
  // Code that will run only after the entire view has been rendered
  nextTick(() => {
    // clean previous version
    for (const i in titleBox) {
      delete titleBox[i];
    }
    // fill new ones
    for (const i in mapNodes) {
      const node = mapNodes[i];
      const dom = document.getElementById(`${titleIdPrefix}${node.id}`);
      if (dom == null) {
        continue;
      }
      if (position == "center") {
        titleBox[node.id] = {
          position: {
            x: node.center.x - dom.getBoundingClientRect().width / 2,
            y: node.center.y - dom.getBoundingClientRect().height / 2
          },
          bbox: {
            width: dom.getBoundingClientRect().width,
            height: dom.getBoundingClientRect().height
          }
        };
      } else if (position == "left") {
        titleBox[node.id] = {
          position: {
            x: node.center.x - dom.getBoundingClientRect().width,
            y: node.center.y - dom.getBoundingClientRect().height / 2
          },
          bbox: {
            width: dom.getBoundingClientRect().width,
            height: dom.getBoundingClientRect().height
          }
        };
      }
    }
  });
};

export const getTitleBoxes = (titleIdPrefix: string, position: "center" | "left", mapNodes: Ref<Array<MapNode>>): Ref<Record<string, TitleBox>> => {
  const titleBox = ref(nodeToTitleBox(mapNodes.value));
  /**
   * Update titleBox on every prop change after DOM rerender
   */
  watch(
    mapNodes,
    mps => updateTitleBox(titleIdPrefix, position, mps, titleBox.value),
    {
      immediate: true
    }
  );

  return titleBox
}
