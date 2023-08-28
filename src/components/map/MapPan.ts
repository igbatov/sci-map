import {Vector} from "@/types/graphics";

const mouseDownBg = {
  on: false
};

const mouseDown = () => {
  mouseDownBg.on = true;
};
const mouseUp = () => {
  mouseDownBg.on = false;
};

const mouseMove = (
  emit: (name: "dragging-background", o: any) => void,
  vector: Vector
) => {
  if (!mouseDownBg.on) {
    return;
  }
  emit("dragging-background", vector);
};

export default {
  mouseDown,
  mouseUp,
  mouseMove,
};
