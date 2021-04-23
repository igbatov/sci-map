import { Point } from "@/types/graphics";

export const mutations = {
  ADD_CUT_PASTE: "ADD_CUT_PASTE",
  ADD_CREATE: "ADD_CREATE",
  ADD_REMOVE: "ADD_REMOVE",
  ADD_POSITION_CHANGE: "ADD_POSITION_CHANGE"
};

enum changeTypeEnum {
  CUT_PASTE = "CUT_PASTE",
  CREATE = "CREATE",
  REMOVE = "REMOVE",
  POSITION_CHANGE = "POSITION_CHANGE"
}

const changeTypes = {
  CUT_PASTE: "CUT_PASTE" as changeTypeEnum.CUT_PASTE,
  CREATE: "CREATE" as changeTypeEnum.CREATE,
  REMOVE: "REMOVE" as changeTypeEnum.REMOVE,
  POSITION_CHANGE: "POSITION_CHANGE" as changeTypeEnum.POSITION_CHANGE
};

export interface CHCutPaste {
  nodeID: string; // object of change
  oldParentID: string; // old parent
  newParentID: string; // new parent
}

export interface CHCreate {
  nodeID: string; // object of change
  parentID: string; // new parent
}

export interface CHRemove {
  nodeID: string; // object of change
}

export interface CHPositionChange {
  nodeID: string; // object of change
  newPosition: Point; // new position
}

export type TreeChangeList = Record<
  string,
  {
    [changeTypeEnum.CUT_PASTE]?: CHCutPaste;
    [changeTypeEnum.CREATE]?: CHCreate;
    [changeTypeEnum.REMOVE]?: CHRemove;
    [changeTypeEnum.POSITION_CHANGE]?: CHPositionChange;
  }
>;

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
    stableChangeList: {},
    localChangeList: {}
  },
  mutations: {
    [mutations.ADD_CUT_PASTE](state: State, change: CHCutPaste) {
      if (!state.localChangeList[change.nodeID]) {
        state.localChangeList[change.nodeID] = {};
      }
      if (state.localChangeList[change.nodeID][changeTypes.CREATE]) {
        // if user ADDed then MOVEd node then it is simply addition to CUT_PASTE newParentID
        state.localChangeList[change.nodeID][changeTypes.CREATE]!.parentID =
          change.newParentID;
      } else {
        state.localChangeList[change.nodeID][changeTypes.CUT_PASTE] = change;
      }
    },
    [mutations.ADD_CREATE](state: State, change: CHCreate) {
      if (!state.localChangeList[change.nodeID]) {
        state.localChangeList[change.nodeID] = {};
      }
      state.localChangeList[change.nodeID][changeTypes.CREATE] = change;
    },
    [mutations.ADD_REMOVE](state: State, change: CHRemove) {
      // clear changelist for this node because REMOVE vanishes them anyway
      state.localChangeList[change.nodeID] = {};
      state.localChangeList[change.nodeID][changeTypes.REMOVE] = change;
    },
    [mutations.ADD_POSITION_CHANGE](state: State, change: CHPositionChange) {
      if (!state.localChangeList[change.nodeID]) {
        state.localChangeList[change.nodeID] = {};
      }
      state.localChangeList[change.nodeID][
        changeTypes.POSITION_CHANGE
      ] = change;
    }
  },
  actions: {}
};
