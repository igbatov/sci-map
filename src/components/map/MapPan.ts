
const mouseDownBg = {
  on: false
};

const mouseDown = (event: MouseEvent) => {
  mouseDownBg.on = true;
};
const mouseUp = (event: MouseEvent) => {
  mouseDownBg.on = false;
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
};
