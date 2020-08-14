import {SET_ROOT_WH, SET_ROOT_XY, GetRoot, GetNode} from "@/store/index";
import { UpdateCurrentLevel } from "@/store/level";
import {sleep} from "@/store/utils";

export const SCALE_CF = 1.03;
export const Zoom = "Zoom";
export const ZoomAndPan = "ZoomAndPan";

export default {
  namespaced: true,
  actions: {
    async [ZoomAndPan]({ commit, dispatch, rootGetters }, {nodeId, targetXY, targetWH}) {
      const node = rootGetters[GetNode](nodeId)
      let nodeWH = node.GetWH()
      let nodeAbsXY = node.GetAbsoluteXY()
      let zoomStepCount = 0;
      let zoomDirection = 0;
      if (
        nodeWH.height < targetWH.height &&
        nodeWH.width < targetWH.width
      ) {
        // Zoom in until top and bottom fit targetWH.height or left and right fit targetWH.width
        zoomDirection = -1;
        let tillHeightSteps = 0;
        let height = nodeWH.height;
        while (height < targetWH.height) {
          height = height * SCALE_CF;
          tillHeightSteps++;
        }
        let tillWidthSteps = 0;
        let width = nodeWH.width;
        while (width < targetWH.width) {
          width = width * SCALE_CF;
          tillWidthSteps++;
        }
        zoomStepCount = Math.min(tillHeightSteps, tillWidthSteps);
      } else if (nodeWH.height > targetWH.height) {
        // Zoom out
        zoomDirection = 1;
        let height = nodeWH.height;
        while (height > targetWH.height) {
          height = height / SCALE_CF;
          zoomStepCount++;
        }
      } else if (nodeWH.width > targetWH.width) {
        // Zoom out
        zoomDirection = 1;
        let width = nodeWH.width;
        while (width > targetWH.width) {
          width = width / SCALE_CF;
          zoomStepCount++;
        }
      }

      let nodeMiddle = {
        x: nodeAbsXY.x + nodeWH.width / 2,
        y: nodeAbsXY.y + nodeWH.height / 2
      };

      const root = rootGetters[GetRoot]
      if (zoomStepCount <= 1) {
        // if we do not need zoom
        const DEFAULT_STEP = 10;
        const xStep = (targetXY.x - nodeMiddle.x) / DEFAULT_STEP;
        const yStep = (targetXY.y - nodeMiddle.y) / DEFAULT_STEP;
        for (let i = 0; i < DEFAULT_STEP; i++) {
          const rootXY = root.GetXY();
          commit(SET_ROOT_XY,
            { x: rootXY.x + xStep, y: rootXY.y + yStep },
            { root: true },
          );
          await sleep(50);
        }
      } else {
        const xStep = (targetXY.x - nodeMiddle.x) / zoomStepCount;
        const yStep = (targetXY.y - nodeMiddle.y) / zoomStepCount;
        for (let i = 0; i < zoomStepCount; i++) {
          nodeAbsXY = node.GetAbsoluteXY()
          nodeWH = node.GetWH()
          nodeMiddle = {
            x: nodeAbsXY.x + nodeWH.width / 2,
            y: nodeAbsXY.y + nodeWH.height / 2
          };
          await dispatch("zoomPan/" + Zoom, {
            deltaY: zoomDirection,
            x: nodeMiddle.x,
            y: nodeMiddle.y
          }, { root: true });
          const rootXY = root.GetXY();
          commit(SET_ROOT_XY, {
            x: rootXY.x + xStep,
            y: rootXY.y + yStep
          }, { root: true });
          await sleep(50);
        }
      }
    },
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

export const calcZoom = (rootXY, rootWH, event) => {
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

  let newX = rootXY.x,
    newY = rootXY.y;
  // during zoom pan to area under mouse cursor
  if (event.deltaY < 0) {
    newX = rootXY.x - (-rootXY.x + event.x) * (SCALE_CF - 1);
    newY = rootXY.y - (-rootXY.y + event.y) * (SCALE_CF - 1);
  } else if (event.deltaY > 0) {
    newX = rootXY.x + (-rootXY.x + event.x) * (1 - 1 / SCALE_CF);
    newY = rootXY.y + (-rootXY.y + event.y) * (1 - 1 / SCALE_CF);
  }

  // Stop panning if area is out of the borders
  // if (newX > 0) {
  //   newX = 0;
  // }
  // if (newY > 0) {
  //   newY = 0;
  // }
  // if (newX + newW < window.innerWidth) {
  //   newX = window.innerWidth - newW;
  // }
  // if (newY + newH < window.innerHeight) {
  //   newY = window.innerHeight - newH;
  // }

  return { width: newW, height: newH, x: newX, y: newY };
};
