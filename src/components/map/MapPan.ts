import { reactive } from "vue";
import { MapNode } from "@/types/graphics";
import { printError } from "@/tools/utils";

let bgMouseDownResolvers: Record<
  any,
  { resolve: (v: any) => void; reject: (v: any) => void; promise: Promise<any> }
> = {};

const mouseDownBg = reactive({
  on: false,
  startPoint: { x: 0, y: 0 }
});

let draggingBackgroundOn = false;

let pinNodeMouseDown = false;

let layers: Array<Record<number, MapNode>> | undefined = [];

const updateMouseDownResolvers = () => {
  bgMouseDownResolvers = {};
  for (const i in layers) {
    const promise = new Promise(function(resolve, reject) {
      bgMouseDownResolvers[i] = { resolve, reject, promise };
    });
    bgMouseDownResolvers[i].promise = promise;
  }
};

const setLayers = (ls: Array<Record<number, MapNode>> | undefined) => {
  layers = ls;
  updateMouseDownResolvers();
};

const mouseDown = async (event: MouseEvent) => {
  const values = await Promise.allSettled<Promise<number>[]>(
    Object.values(bgMouseDownResolvers).map(v => v.promise)
  );
  updateMouseDownResolvers();
  // if one of promises was rejected - that was on node mouse down
  if (
    !values.reduce(
      (prev, current) => prev * (current.status == "fulfilled" ? 1 : 0),
      1
    )
  ) {
    return;
  }

  mouseDownBg.on = true;
  mouseDownBg.startPoint = { x: event.clientX, y: event.clientY };
};

const mouseUp = (emit: (
    name: "click-background",
    o: any
  ) => void
) => {
  if (mouseDownBg.on && !draggingBackgroundOn && !pinNodeMouseDown) {
    emit("click-background", {})
  }
  mouseDownBg.on = false;
  draggingBackgroundOn = false;
  pinNodeMouseDown = false
};

const pinNodeMouseDownHandler = () => {
  pinNodeMouseDown = true
}

const mouseMove = (
  emit: (
    name: "dragging-background",
    o: any
  ) => void,
  event: MouseEvent
) => {
  if (!mouseDownBg.on) {
    return;
  }
  draggingBackgroundOn = true;
  emit("dragging-background", {
    from: {
      x: event.clientX - event.movementX,
      y: event.clientY - event.movementY
    },
    to: { x: event.clientX, y: event.clientY }
  });
};

const bgMouseDownReject = (layerId: number) => {
  bgMouseDownResolvers[layerId].reject(0);
};

const bgMouseDownResolve = (layerId: number) => {
  if (!bgMouseDownResolvers[layerId]) {
    printError(
      "bgMouseDownResolve: cannot find bgMouseDownResolvers[layerId]",
      { "requested layerId": layerId, has: Object.keys(bgMouseDownResolvers) }
    );
  }
  bgMouseDownResolvers[layerId].resolve(0);
};

export default {
  setLayers,
  mouseDown,
  mouseUp,
  mouseMove,
  bgMouseDownReject,
  bgMouseDownResolve,
  pinNodeMouseDownHandler,
};
