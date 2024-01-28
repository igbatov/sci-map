import { MapNode, Point } from "@/types/graphics";
import { nextTick, ref, Ref, watch } from "vue";

export type EventClickNode = {
  id: string;
};

export type EventDraggingNode = {
  nodeId: string;
  delta: Point;
};

export type MouseDownInfo = {
  nodeId: string | null;
  dragStart: boolean;
};

type emitFn = (event: "title-dragging" | "title-drop", ...args: any[]) => void;

type TitleBox = {
  position: Point;
  bbox: {
    width: number;
    height: number;
  };
};

export const mouseMoveListener = (
  emit: emitFn,
  event: MouseEvent,
  mouseDownInfo: MouseDownInfo
) => {
  if (mouseDownInfo.nodeId) {
    mouseDownInfo.dragStart = true;
    emit("title-dragging", {
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
      emit("title-drop", { id: mouseDownInfo.nodeId });
    }
    mouseDownInfo.dragStart = false;
    mouseDownInfo.nodeId = null;
  }
};

export const nodeToTitleBox = (
  nodes: Record<string, MapNode>
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

const updateTitleBox = async (
  titleIdPrefix: string,
  position: "center" | "left",
  mapNodes: Record<string, MapNode>,
): Promise<Record<string, TitleBox>> => {
  const titleBox = {} as Record<any, TitleBox>

  // Code that will run only after the entire view has been rendered
  await nextTick(() => {

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

  return titleBox;
};

export const setTitleBoxes = (
  titleIdPrefix: string,
  position: "center" | "left",
  mapNodes: Ref<Record<string, MapNode>>,
  cb: (titleBoxMap: Record<string, TitleBox>) => void,
) => {
  cb(nodeToTitleBox(mapNodes.value))
  /**
   * Update titleBox on every prop change after DOM rerender
   */
  watch(
    mapNodes,
    async (mps) => {
      return updateTitleBox(titleIdPrefix, position, mps).then((titleBoxMap) => cb(titleBoxMap))
    },
    {
      immediate: true
    }
  );
};
