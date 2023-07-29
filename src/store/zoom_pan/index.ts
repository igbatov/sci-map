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
  SET_ZOOM_CENTER: "SET_ZOOM_CENTER"
};

const zoomDebounce = debounce((state, value: number) => {
  state.debouncedZoom = value;
}, 100);

const panDebounce = debounce((state, value: Point) => {
  state.debouncedPan = value;
}, 100);

const ZOOM_SENSITIVITY = 1 / 100;
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
      state.zoom = state.zoom * Math.pow(2, delta * ZOOM_SENSITIVITY);
      zoomDebounce(state, state.zoom);
    },
    [mutations.ADD_PAN](state: State, delta: Vector) {
      state.pan = addVector(
        { from: { x: 0, y: 0 }, to: state.pan },
        vectorOnNumber(delta, PAN_SENSITIVITY)
      ).to;
      panDebounce(state, state.pan);
    }
  }
};
