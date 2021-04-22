import { Commit, createStore, Store, useStore as baseUseStore } from "vuex";
import { InjectionKey } from "vue";
import { store as pinStore, State as PinState } from "./pin";
import { store as treeStore, State as TreeState, mutations as treeMutations } from "./tree";
import { store as zoomPanStore, State as ZoomPanState } from "./zoom_pan";
import {
  store as userStore,
  State as UserState,
  mutations as userMutations
} from "./user";
import {store as historyStore, State as HistoryState, mutations as historyMutations, changeTypes} from "./history";

import api from "@/api/api";
import { fetchMap, fetchPins } from "./helpers";
import {Point} from "@/types/graphics";
import {findMapNode} from "@/store/tree/helpers";
import NewErrorKV from "@/tools/errorkv";
import {addVector} from "@/tools/graphics";

export type State = {
  pin: PinState;
  tree: TreeState;
  user: UserState;
  zoomPan: ZoomPanState;
  history: HistoryState;
};

export const actions = {
  init: "init",
  updateNodePosition: "updateNodePosition",
  addNewNode: "addNewNode",
  cutPasteNode: "cutPasteNode",
  removeNode: "removeNode"
};

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  actions: {
    async [actions.init]({ commit }: { commit: Commit }) {
      api.initFirebase();
      const user = await api.getCurrentUser();
      commit(`user/${userMutations.SET_USER}`, user);
      await fetchMap(user);
      await fetchPins(user);
    },
    [actions.updateNodePosition]({ commit, state }: { commit: Commit, state: State }, v: { nodeId: string; delta: Point }) {
      const [mapNode] = findMapNode(v.nodeId, state.tree.mapNodeLayers);
      if (!mapNode) {
        return NewErrorKV(
          "UPDATE_NODE_POSITION: cannot find mapNode",
          {"v.nodeId": v.nodeId, "state.mapNodeLayers":state.tree.mapNodeLayers}
        )
      }
      const newCenter = addVector(
        { from: { x: 0, y: 0 }, to: mapNode.center },
        { from: { x: 0, y: 0 }, to: v.delta }
      ).to;

      const args = { nodeId: v.nodeId, newCenter, result: null }
      commit(`tree/${treeMutations.UPDATE_NODE_POSITION}`, args);
      if (args.result === null) {
        commit(`history/${historyMutations.ADD_CHANGE}`, {
          type: changeTypes.CHILDREN_POSITIONS_CHANGE,
          nodeID: v.nodeId,
          parentID: null,
          oldParentID: null,
          newPosition: newCenter,
        });
      }
    }
  },
  modules: {
    pin: pinStore,
    tree: treeStore,
    user: userStore,
    zoomPan: zoomPanStore,
    history: historyStore
  }
});

// reactively change tree based on user change
store.watch(state => state.user.user, fetchMap);
// reactively change pins based on user change
store.watch(state => state.user.user, fetchPins);

// define your own `useStore` composition function
export function useStore() {
  return baseUseStore(key);
}
