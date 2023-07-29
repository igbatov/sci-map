import { MapNode } from "@/types/graphics";

const mouseDownBg = {
  on: false
};

let pinNodeMouseDown = false;

const mouseDown = async (event: MouseEvent) => {
  mouseDownBg.on = true;
};
const mouseUp = async (event: MouseEvent) => {
  mouseDownBg.on = false;
  pinNodeMouseDown = false;
};

const pinNodeMouseDownHandler = () => {
  pinNodeMouseDown = true;
};

const mouseMove = (
  emit: (name: "dragging-background", o: any) => void,
  event: MouseEvent
) => {
  if (!mouseDownBg.on) {
    return;
  }
  emit("dragging-background", {
    from: {
      x: event.clientX - event.movementX,
      y: event.clientY - event.movementY
    },
    to: { x: event.clientX, y: event.clientY }
  });
};

export default {
  mouseDown,
  mouseUp,
  mouseMove,
  pinNodeMouseDownHandler
};
