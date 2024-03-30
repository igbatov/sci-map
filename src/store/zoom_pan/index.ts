import { Point, Vector } from "@/types/graphics";
import { addVector, vectorOnNumber } from "@/tools/graphics";
import { debounce } from "lodash";

export interface State {
  zoom: number;
  zoomCenter: Point;
  pan: Point;
  debouncedZoom: number;
  debouncedPan: Point;
}

export const mutations = {
  ADD_ZOOM: "ADD_ZOOM",
  ADD_PAN: "ADD_PAN",
  SET_PAN: "SET_PAN",
  SET_ZOOM_CENTER: "SET_ZOOM_CENTER",
  RESET_ZOOM_AND_PAN: "RESET_ZOOM_AND_PAN"
};

const zoomDebounce = debounce((state, value: number) => {
  state.debouncedZoom = value;
}, 100);

const panDebounce = debounce((state, value: Point) => {
  state.debouncedPan = value;
}, 100);

const ZOOM_SENSITIVITY = 1 / 500;
const PAN_SENSITIVITY = 1;

export const store = {
  namespaced: true,
  state: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    debouncedZoom: 1,
    debouncedPan: { x: 0, y: 0 },
    zoomCenter: { x: 0, y: 0 }
  },
  mutations: {
    [mutations.SET_ZOOM_CENTER](state: State, center: Point) {
      state.zoomCenter = center;
    },
    [mutations.ADD_ZOOM](state: State, delta: number) {
      const newZoom = state.zoom * Math.pow(2, delta * ZOOM_SENSITIVITY);
      if (newZoom < 0.5) {
        // foolproof from too much zoom
        return;
      }
      state.zoom = newZoom;
      zoomDebounce(state, state.zoom);
    },
    [mutations.ADD_PAN](state: State, delta: Vector) {
      state.pan = addVector(
        { from: { x: 0, y: 0 }, to: state.pan },
        vectorOnNumber(delta, PAN_SENSITIVITY)
      ).to;
      panDebounce(state, state.pan);
    },
    [mutations.SET_PAN](state: State, point: Point) {
      state.pan = point;
      panDebounce(state, state.pan);
    },
    [mutations.RESET_ZOOM_AND_PAN](state: State, point: Point) {
      state.pan = {x:0, y:0};
      panDebounce(state, state.pan);
      state.zoom = 1;
      zoomDebounce(state, state.zoom);
    }
  }
};
