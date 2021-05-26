import { MapNode } from "@/types/graphics";
import { printError } from "@/tools/utils";

let bgMouseDownResolvers: Record<
  any,
  { resolve: (v: any) => void; reject: (v: any) => void; promise: Promise<any> }
> = {};

const mouseDownBg = {
  on: false
};

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
  mouseDownBg.on = false;

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
};

const mapClick = async (emit: (name: "click-background", o: any) => void) => {
  if (mouseDownBg.on && !pinNodeMouseDown) {
    emit("click-background", {});
  }
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
  mouseMove,
  bgMouseDownReject,
  bgMouseDownResolve,
  pinNodeMouseDownHandler,
  mapClick
};
