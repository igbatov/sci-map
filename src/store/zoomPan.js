import { SET_ROOT_WH, SET_ROOT_XY, GetRoot } from "@/store/index";
import { UpdateCurrentLevel } from "@/store/level";

export const SCALE_CF = 1.03;
export const Zoom = "Zoom";

export default {
  namespaced: true,
  actions: {
    [Zoom]({ commit, dispatch, rootGetters }, event) {
      let z = calcZoom(
        rootGetters[GetRoot].GetXY(),
        rootGetters[GetRoot].GetWH(),
        event
      );

      // apply changes
      if (z) {
        commit(
          SET_ROOT_WH,
          { width: z.width, height: z.height },
          { root: true }
        );
        commit(SET_ROOT_XY, { x: z.x, y: z.y }, { root: true });
        dispatch("level/" + UpdateCurrentLevel, {}, { root: true });
      }
    }
  }
};

const calcZoom = (rootXY, rootWH, event) => {
  let newW = rootWH.width,
    newH = rootWH.height;
  if (event.deltaY < 0) {
    newW = newW * SCALE_CF;
    newH = newH * SCALE_CF;
  } else if (event.deltaY > 0) {
    newW = newW / SCALE_CF;
    newH = newH / SCALE_CF;
  }

  if (newW < window.innerWidth || newH < window.innerHeight) {
    return;
  }

  let oldX = rootXY.x,
    oldY = rootXY.y;

  let newX = oldX,
    newY = oldY;
  // during zoom pan to area under mouse cursor
  if (event.deltaY < 0) {
    newX = oldX - (-oldX + event.x) * (SCALE_CF - 1);
    newY = oldY - (-oldY + event.y) * (SCALE_CF - 1);
  } else if (event.deltaY > 0) {
    newX = oldX + (-oldX + event.x) * (1 - 1 / SCALE_CF);
    newY = oldY + (-oldY + event.y) * (1 - 1 / SCALE_CF);
  }

  // stop panning if area is out of the borders
  if (newX > 0) {
    newX = 0;
  }
  if (newY > 0) {
    newY = 0;
  }
  if (newX + newW < window.innerWidth) {
    newX = window.innerWidth - newW;
  }
  if (newY + newH < window.innerHeight) {
    newY = window.innerHeight - newH;
  }

  return { width: newW, height: newH, x: newX, y: newY };
};
