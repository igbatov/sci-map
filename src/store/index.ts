import {Commit, createStore, Dispatch, Store, useStore as baseUseStore} from "vuex";
import { InjectionKey } from "vue";
import { store as pinStore, State as PinState } from "./pin";
import {
  store as treeStore,
  State as TreeState,
  mutations as treeMutations,
  actions as treeActions
} from "./tree";
import { store as zoomPanStore, State as ZoomPanState } from "./zoom_pan";
import {
  store as userStore,
  State as UserState,
  mutations as userMutations
} from "./user";
import {
  store as historyStore,
  State as HistoryState,
  mutations as historyMutations
} from "./history";

import api from "@/api/api";
import { fetchMap, fetchPins } from "./helpers";
import { Point } from "@/types/graphics";
import {createNewNode, findMapNode, getNewNodeCenter} from "@/store/tree/helpers";
import NewErrorKV from "@/tools/errorkv";
import {addVector, morphChildrenPoints} from "@/tools/graphics";
import {DBNode} from "@/api/types";
import {isEqual} from "lodash";

export type State = {
  // root states
  editModeOn: boolean;
  subscribedNodeIDs: string[];

  // module states
  pin: PinState;
  tree: TreeState;
  user: UserState;
  zoomPan: ZoomPanState;
  history: HistoryState;
};

export const actions = {
  init: "init",
  updateNodePosition: "updateNodePosition",
  createNode: "createNode",
  cutPasteNode: "cutPasteNode",
  removeNode: "removeNode",
  handleDBUpdate: "handleDBUpdate", // apply external update from server
  setEditMode: "setEditMode",
  subscribeDBChange: "subscribeDBChange"
};

export const mutations = {
  SET_EDIT_MODE: "SET_EDIT_MODE",
  SET_SUBSCRIBED_NODE_IDS: "SET_SUBSCRIBED_NODE_IDS",
}

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  state: {
    editModeOn: false,
    subscribedNodeIDs: [] as string[],
  } as State,
  mutations: {
    [mutations.SET_EDIT_MODE](state: State, val: boolean) {
      state.editModeOn = val
    },
    [mutations.SET_SUBSCRIBED_NODE_IDS](state: State, val: string[]) {
      state.subscribedNodeIDs = val
    }
  },
  actions: {
    [actions.setEditMode]({ commit, state }: { commit: Commit, state: State }, val: boolean) {
      commit(mutations.SET_EDIT_MODE, val)
      if (!val) {
        state.subscribedNodeIDs.forEach((id) =>  api.unsubscribeDBChange("map/" + id))
        commit(mutations.SET_SUBSCRIBED_NODE_IDS, [])
      }
    },

    async [actions.handleDBUpdate]({ dispatch }: { dispatch: Dispatch }, newNode: DBNode) {
      await dispatch(`tree/${treeActions.handleDBUpdate}`, newNode)
    },

    async [actions.init]({ commit }: { commit: Commit }) {
      api.initFirebase();
      const user = await api.getCurrentUser();
      commit(`user/${userMutations.SET_USER}`, user);
      await fetchMap(user);
      await fetchPins(user);
    },

    async [actions.createNode](
      { commit, state }: { commit: Commit, state: State },
      v: {
        parentID: string;
        title: string;
      }
    ) {
      const args = {
        parentID: v.parentID,
        title: v.title,
        return: { error: null, nodeID: "" }
      };

      const parent = state.tree.nodeRecord[v.parentID].node
      const [parentMapNode] = findMapNode(parent.id, state.tree.mapNodeLayers)
      const [newCenter] = getNewNodeCenter(parent, state.tree.mapNodeLayers)
      const node = createNewNode(v.title, newCenter!)
      const centers = {[node.id]: node.position}
      const [normalizedPosition] = morphChildrenPoints(
        parentMapNode!.border,
        [{x:0, y:0}, {x:0, y:api.ST_HEIGHT}, {x:api.ST_WIDTH, y:api.ST_HEIGHT}, {x:api.ST_WIDTH, y:0}],
        centers
      )
      await api.transaction(node.id, (_) => {
        return {
          id: node.id,
          parentID: v.parentID,
          name: v.title,
          children: [],
          position: normalizedPosition![node.id]
        } as DBNode;
      })

      if (args.return.error === null) {
        commit(`history/${historyMutations.ADD_CREATE}`, {
          nodeID: node.id,
          parentID: v.parentID
        });
      }
    },

    [actions.cutPasteNode](
      { commit }: { commit: Commit },
      v: {
        nodeID: string;
        parentID: string;
      }
    ) {
      const args = {
        nodeID: v.nodeID,
        parentID: v.parentID,
        returnError: null
      };
      // remove nodeID from oldParent children,
      // add to newParent children,
      // recalculate position of node, normalize it and
      // update DB with these three modifications in one transaction

      // commit(`tree/${treeMutations.CUT_PASTE_NODE}`, args);
      if (args.returnError === null) {
        commit(`history/${historyMutations.ADD_CUT_PASTE}`, {
          nodeID: v.nodeID,
          parentID: v.parentID
        });
      }
    },

    [actions.removeNode](
      { commit, state }: { commit: Commit; state: State },
      nodeID: string
    ) {
      const args = { nodeID: nodeID, returnError: null };
      // remove node from DB

      //commit(`tree/${treeMutations.REMOVE_NODE}`, args);
      if (args.returnError === null) {
        commit(`history/${historyMutations.ADD_REMOVE}`, {
          parentNodeID: state.tree.nodeRecord[nodeID].parent!.id,
          nodeID: nodeID
        });
      }
    },

    [actions.updateNodePosition](
      { commit, state }: { commit: Commit; state: State },
      v: { nodeId: string; delta: Point }
    ) {
      const [mapNode] = findMapNode(v.nodeId, state.tree.mapNodeLayers);
      if (!mapNode) {
        return NewErrorKV("UPDATE_NODE_POSITION: cannot find mapNode", {
          "v.nodeId": v.nodeId,
          "state.mapNodeLayers": state.tree.mapNodeLayers
        });
      }
      const newCenter = addVector(
        { from: { x: 0, y: 0 }, to: mapNode.center },
        { from: { x: 0, y: 0 }, to: v.delta }
      ).to;

      const args = { nodeId: v.nodeId, newCenter, returnError: null };
      commit(`tree/${treeMutations.UPDATE_NODE_POSITION}`, args);
      if (args.returnError === null) {
        commit(`history/${historyMutations.ADD_POSITION_CHANGE}`, {
          nodeID: v.nodeId,
          oldPosition: mapNode.center,
          newPosition: newCenter
        });
      }
    },

    [actions.subscribeDBChange](
      { commit, state }: { commit: Commit; state: State },
      v: {oldNodeIDs: string[], newNodeIDs: string[], cb: (dbNode: DBNode) => void},
    ) {
      // check we really need unsubscribe/subscribe
      if (isEqual(v.oldNodeIDs.sort(), v.newNodeIDs.sort())) {
        return
      }

      // unsubscribe old nodes that have visible titles
      v.oldNodeIDs.forEach((id) =>  api.unsubscribeDBChange("map/"+id))

      // subscribe new nodes that have visible titles
      v.newNodeIDs.forEach((id) =>  api.subscribeDBChange("map/"+id, (snapshot) => {
        const node = snapshot.val();
        v.cb(node)
      }))

      commit(mutations.SET_SUBSCRIBED_NODE_IDS, v.newNodeIDs)
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
