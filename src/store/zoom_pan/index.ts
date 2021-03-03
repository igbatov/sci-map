import {Point, Vector} from "@/types/graphics";
import {addVector} from "@/tools/graphics";
import {debounce} from "lodash";

export interface State {
  zoom: number;
  pan: Point;
  debouncedZoom: number;
  debouncedPan: Point;
}

export const mutations = {
  ADD_ZOOM: "ADD_ZOOM",
  ADD_PAN: "ADD_PAN",
  SET_DEBOUNCED_ZOOM: "SET_DEBOUNCED_ZOOM",
  SET_DEBOUNCED_PAN: "SET_DEBOUNCED_PAN"
};

const zoomDebounce = debounce((state, value: number)=>{
  state.debouncedZoom = value;
}, 1000)

const panDebounce = debounce((state, value: Point)=>{
  state.debouncedPan = value;
}, 1000)


export const store = {
  namespaced: true,
  state: {
    zoom: 0,
    pan: {x:0, y:0},
    debouncedZoom: 0,
    debouncedPan: {x:0, y:0}
  },
  mutations: {
    [mutations.ADD_ZOOM](state: State, delta: number) {
      state.zoom = state.zoom + delta;
      zoomDebounce(state, state.zoom)
    },
    [mutations.ADD_PAN](state: State, delta: Vector) {
      state.pan = addVector({from: {x:0, y:0}, to: state.pan}, delta).to;
      panDebounce(state, state.pan)
    },
    [mutations.SET_DEBOUNCED_ZOOM](state: State, val: number) {
      state.debouncedZoom = val
    },
    [mutations.SET_DEBOUNCED_PAN](state: State, val: Point) {
      state.debouncedPan = val
    }
  }
}
