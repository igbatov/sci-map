import {Point} from "@/types/graphics";

export const mutations = {
  ADD_CHANGE: "ADD_CHANGE",
};

export const changeTypes = {
  MOVE: "MOVE",
  ADD: "ADD",
  REMOVE: "REMOVE",
  CHILDREN_POSITIONS_CHANGE: "CHILDREN_POSITIONS_CHANGE",
};

export interface TreeChange {
  type: 'MOVE' | 'ADD' | 'REMOVE' | 'CHILDREN_POSITIONS_CHANGE';  // change type
  nodeID: string; // object of change
  parentID: string | null; // new parent
  oldParentID: string | null; // old parent
  newPosition: Point | null // new position (if any)
}
export type TreeChangeList = TreeChange[];

export interface State {
  // список изменений который отличает текущую мастер ветку
  // от того мастера с которого мы начали локальные изменения
  stableChangeList: TreeChangeList;
  // список локальных изменений
  localChangeList: TreeChangeList;
}

export const store = {
  namespaced: true,
  state: {
    stableChangeList: [],
    localChangeList: []
  },
  mutations: {
    [mutations.ADD_CHANGE](state: State, change: TreeChange) {
      state.localChangeList.push(change)
      console.log(state.localChangeList)
    }
  },
  actions: {}
}
