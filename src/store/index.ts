import {
  Commit,
  createStore,
  Dispatch,
  Store,
  useStore as baseUseStore
} from "vuex";
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
import { MapNode, Point } from "@/types/graphics";
import {
  createNewNode,
  findMapNode,
  getNewNodeCenter
} from "@/store/tree/helpers";
import NewErrorKV from "@/tools/errorkv";
import {
  addVector,
  convertPosition,
  morphChildrenPoints
} from "@/tools/graphics";
import { DBNode } from "@/api/types";
import { isEqual, debounce } from "lodash";
import {printError} from "@/tools/utils";

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
  SET_SUBSCRIBED_NODE_IDS: "SET_SUBSCRIBED_NODE_IDS"
};

const debouncedPositionSet = debounce(
  (
    nodeID: string,
    newCenter: Point,
    parentID: string,
    mapNodeLayers: Record<string, MapNode>[]
  ) => {
    const [normalizedNewNodeCenter] = convertPosition(
      "normalize",
      newCenter,
      parentID,
      mapNodeLayers
    );

    api.update({ [`map/${nodeID}/position`]: normalizedNewNodeCenter });
  },
  200
);

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  state: {
    editModeOn: false,
    subscribedNodeIDs: [] as string[]
  } as State,
  mutations: {
    [mutations.SET_EDIT_MODE](state: State, val: boolean) {
      state.editModeOn = val;
    },
    [mutations.SET_SUBSCRIBED_NODE_IDS](state: State, val: string[]) {
      state.subscribedNodeIDs = val;
    }
  },
  actions: {
    [actions.setEditMode](
      { commit, state }: { commit: Commit; state: State },
      val: boolean
    ) {
      commit(mutations.SET_EDIT_MODE, val);
      if (!val) {
        state.subscribedNodeIDs.forEach(id =>
          api.unsubscribeDBChange("map/" + id)
        );
        commit(mutations.SET_SUBSCRIBED_NODE_IDS, []);
      }
    },

    async [actions.handleDBUpdate](
      { dispatch, state }: { dispatch: Dispatch; state: State },
      node: DBNode
    ) {
      await dispatch(`tree/${treeActions.handleDBUpdate}`, {
        dbNode: node,
        user: state.user.user
      });
    },

    async [actions.init]({ commit }: { commit: Commit }) {
      api.initFirebase();
      const user = await api.getCurrentUser();
      commit(`user/${userMutations.SET_USER}`, user);
      await fetchMap(user);
      await fetchPins(user);
    },

    async [actions.createNode](
      { commit, state }: { commit: Commit; state: State },
      v: {
        parentID: string;
        title: string;
      }
    ) {
      const parent = state.tree.nodeRecord[v.parentID].node;
      const [newCenter, changedNode, err1] = getNewNodeCenter(parent, state.tree.mapNodeLayers);
      if (err1 !== null) {
        printError("Cannot create new center", {err: err1, parent, "state.tree.mapNodeLayers":state.tree.mapNodeLayers})
        return
      }

      const [normalizedPosition, err2] = convertPosition(
        "normalize",
        newCenter!,
        v.parentID,
        state.tree.mapNodeLayers
      );
      if (err2) {
        printError("createNode: cannot create new center", {err: err2, parent, "state.tree.mapNodeLayers":state.tree.mapNodeLayers})
        return
      }
      const node = createNewNode(v.title, normalizedPosition!);
      const newDBNode = {
        id: node.id,
        parentID: v.parentID,
        name: v.title,
        children: [],
        position: normalizedPosition
      };
      const newKey = api.generateKey()
      const updateMap: Record<string, any> = {
        [`map/${newDBNode.id}`]: newDBNode,
        [`map/${newDBNode.parentID}/children/${newKey}`]: newDBNode.id
      }

      if (changedNode) {
        const [normalizedChangedCenter] = convertPosition(
          "normalize",
          changedNode.position,
          v.parentID,
          state.tree.mapNodeLayers
        );
        updateMap[`map/${changedNode.id}/position`] = normalizedChangedCenter
      }

      await api.update(updateMap);

      commit(`history/${historyMutations.ADD_CREATE}`, {
        nodeID: node.id,
        parentID: v.parentID
      });
    },

    async [actions.cutPasteNode](
      { commit, state }: { commit: Commit; state: State },
      v: {
        nodeID: string;
        parentID: string;
      }
    ) {
      // remove nodeID from oldParent children,
      // add to newParent children,
      // recalculate position of node, normalize it and
      // update DB with these three modifications in one transaction
      const oldParent = state.tree.nodeRecord[v.nodeID].parent;
      const newParent = state.tree.nodeRecord[v.parentID].node;
      const [newCenter, changedNode, err1] = getNewNodeCenter(newParent, state.tree.mapNodeLayers);
      if (err1) {
        printError("cutPasteNode: cannot getNewNodeCenter", {err: err1})
        return
      }
      const [normalizedNewNodeCenter, err2] = convertPosition(
        "normalize",
        newCenter!,
        v.parentID,
        state.tree.mapNodeLayers
      );
      if (err2) {
        printError("createNode: cannot create new center", {err: err2, parent, "state.tree.mapNodeLayers":state.tree.mapNodeLayers})
        return
      }
      // generate key for new child in list of newParent
      const newKey = api.generateKey();
      // search for key of childID in children of oldParent
      const oldKey = await api.findKeyOfChild(oldParent!.id, v.nodeID);
      const updateMap = {
        [`map/${v.nodeID}/parentID`]: newParent!.id,
        [`map/${oldParent!.id}/children/${oldKey}`]: null, // remove from old parent children
        [`map/${newParent!.id}/children/${newKey}`]: v.nodeID, // add to children of new parents
        [`map/${v.nodeID}/position`]: normalizedNewNodeCenter
      }
      if (changedNode) {
        const [normalizedChangedCenter] = convertPosition(
          "normalize",
          changedNode.position,
          v.parentID,
          state.tree.mapNodeLayers
        );
        updateMap[`map/${changedNode.id}/position`] = normalizedChangedCenter
      }
      await api.update(updateMap);

      commit(`history/${historyMutations.ADD_CUT_PASTE}`, {
        nodeID: v.nodeID,
        parentID: v.parentID
      });
    },

    async [actions.removeNode](
      { commit, state }: { commit: Commit; state: State },
      nodeID: string
    ) {
      const parent = state.tree.nodeRecord[nodeID].parent;
      if (!parent) {
        return;
      }
      const parentID = parent.id
      // move node from /map to /trash
      const node = await api.getNode(nodeID) as any;
      node.removedAt = Date.now()
      const oldKey = await api.findKeyOfChild(parent.id, nodeID);
      await api.update({
        [`trash/${nodeID}`]: node,
        [`map/${parent.id}/children/${oldKey}`]: null,
        [`map/${nodeID}`]: null
      });

      commit(`history/${historyMutations.ADD_REMOVE}`, {
        parentNodeID: parentID,
        nodeID: nodeID
      });
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

        // save to DB with debounce
        debouncedPositionSet(
          v.nodeId,
          newCenter,
          state.tree.nodeRecord[v.nodeId].parent!.id,
          state.tree.mapNodeLayers
        );
      }
    },

    [actions.subscribeDBChange](
      { commit, state }: { commit: Commit; state: State },
      v: {
        oldNodeIDs: string[];
        newNodeIDs: string[];
        cb: (dbNode: DBNode) => void;
      }
    ) {
      // check we really need unsubscribe/subscribe
      if (isEqual(v.oldNodeIDs.sort(), v.newNodeIDs.sort())) {
        return;
      }

      // unsubscribe old nodes that have visible titles
      v.oldNodeIDs.forEach(id => api.unsubscribeNodeChange(id));

      // subscribe new nodes that have visible titles
      v.newNodeIDs.forEach(id =>
        api.subscribeNodeChange(id, node => {
          v.cb(node);
        })
      );

      commit(mutations.SET_SUBSCRIBED_NODE_IDS, v.newNodeIDs);
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
