import {
  Commit,
  createStore,
  Dispatch,
  Store,
  useStore as baseUseStore
} from "vuex";
import { InjectionKey } from "vue";

import { store as pinStore, State as PinState } from "./pin";

import { store as titleBoxStore, State as TitleBoxState } from "./title_box";

import {
  store as preconditionStore,
  State as PreconditionState
} from "./precondition";

import {
  store as positionChangePermitsStore,
  State as positionChangePermitsState
} from "./position_change_permits";

import {
  store as treeStore,
  State as TreeState,
  mutations as treeMutations
} from "./tree";

import { store as zoomPanStore, State as ZoomPanState } from "./zoom_pan";

import {
  store as userStore,
  State as UserState,
  mutations as userMutations,
  actions as userActions
} from "./user";

import {
  store as historyStore,
  State as HistoryState,
  mutations as historyMutations
} from "./history";

import {
  store as nodeContentStore,
  State as NodeContentState
} from "./node_content";

import {
  store as searchResultStore,
  State as SearchResultState
} from "./search_result";

import api from "@/api/api";
import { initData } from "./helpers";
import { MapNode, Point } from "@/types/graphics";
import {
  createNewNode,
  findMapNode,
  getNewNodeCenter
} from "@/store/tree/helpers";
import NewErrorKV from "@/tools/errorkv";
import { addVector, convertPosition } from "@/tools/graphics";
import { DBNode } from "@/api/types";
import { clone, debounce } from "lodash";
import { printError } from "@/tools/utils";
import firebase from "firebase/compat";

export type State = {
  // root states
  editModeOn: boolean;
  subscribedNodeIDs: string[];

  // module states
  titleBox: TitleBoxState;
  pin: PinState;
  precondition: PreconditionState;
  positionChangePermits: positionChangePermitsState;
  tree: TreeState;
  user: UserState;
  zoomPan: ZoomPanState;
  history: HistoryState;
  nodeContent: NodeContentState;
  searchResult: SearchResultState;
};

export const actions = {
  init: "init",
  updateNodePosition: "updateNodePosition",
  createNode: "createNode",
  cutPasteNode: "cutPasteNode",
  removeNode: "removeNode",
  setEditMode: "setEditMode",
  subscribeDBChange: "subscribeDBChange",

  // confirmSignInPopup
  confirmSignInPopup: "confirmSignInPopup"
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
    /**
     * confirmSignInPopup
     * @param commit
     * @param state
     * @param confirm
     */
    async [actions.confirmSignInPopup](
      { dispatch, state }: { dispatch: Dispatch; state: State },
      confirm: {
        require(args: {
          message?: string;
          target?: EventTarget;
          group?: string;
          icon?: string;
          header?: string;
          accept?: Function;
          reject?: Function;
          acceptLabel?: string;
          rejectLabel?: string;
          acceptIcon?: string;
          rejectIcon?: string;
          blockScroll?: boolean;
          acceptClass?: string;
          rejectClass?: string;
        }): void;

        close(): void;
      }
    ) {
      confirm.require({
        message: "Please authorize to change node contents",
        header: "SignIn",
        acceptLabel: "Ok, Sign In",
        rejectLabel: "No, thanks, just watching",
        accept: async () => {
          await dispatch(`user/${userActions.signIn}`);
        },
        reject: () => {
          return;
        }
      });
    },

    /**
     *
     * @param commit
     * @param state
     * @param val
     */
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

    /**
     *
     * @param commit
     */
    async [actions.init]({ commit }: { commit: Commit }) {
      api.initFirebase();
      firebase.auth().onAuthStateChanged(user => {
        if (user && !user.isAnonymous) {
          api.setPublicUserData(user.uid, user.displayName, null);
          commit(`user/${userMutations.SET_USER}`, user);
          initData(user);
        } else {
          commit(`user/${userMutations.SET_USER}`, null);
          initData(null);
        }
      });
    },

    /**
     *
     * @param commit
     * @param state
     * @param v
     */
    async [actions.createNode](
      { commit, state }: { commit: Commit; state: State },
      v: {
        parentID: string;
        title: string;
      }
    ) {
      const parent = state.tree.nodeRecord[v.parentID].node;
      const [newCenter, changedNode, err1] = getNewNodeCenter(
        parent,
        state.tree.mapNodeLayers,
        true
      );
      if (err1 !== null) {
        printError("Cannot create new center", {
          err: err1,
          parent,
          "state.tree.mapNodeLayers": state.tree.mapNodeLayers
        });
        return;
      }

      const [normalizedPosition, err2] = convertPosition(
        "normalize",
        newCenter!,
        v.parentID,
        state.tree.mapNodeLayers
      );
      if (err2) {
        printError("createNode: cannot create new center", {
          err: err2,
          parent,
          "state.tree.mapNodeLayers": state.tree.mapNodeLayers
        });
        return;
      }
      const node = createNewNode(v.title, normalizedPosition!);
      const newDBNode = {
        id: node.id,
        parentID: v.parentID,
        name: v.title,
        children: [],
        position: normalizedPosition
      };
      const newKey = api.generateKey();
      const updateMap: Record<string, any> = {
        [`map/${newDBNode.id}`]: newDBNode,
        [`map/${newDBNode.parentID}/children/${newKey}`]: newDBNode.id
      };

      if (changedNode) {
        const [normalizedChangedCenter] = convertPosition(
          "normalize",
          changedNode.position,
          v.parentID,
          state.tree.mapNodeLayers
        );
        updateMap[`map/${changedNode.id}/position`] = normalizedChangedCenter;
      }

      await api.update(updateMap);

      commit(`history/${historyMutations.ADD_CREATE}`, {
        nodeID: node.id,
        parentID: v.parentID
      });

      return node.id;
    },

    /**
     *
     * @param commit
     * @param state
     * @param v
     */
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
      const [newCenter, changedNode, err1] = getNewNodeCenter(
        newParent,
        state.tree.mapNodeLayers,
        true
      );
      if (err1) {
        printError("cutPasteNode: cannot getNewNodeCenter", { err: err1 });
        return;
      }
      const [normalizedNewNodeCenter, err2] = convertPosition(
        "normalize",
        newCenter!,
        v.parentID,
        state.tree.mapNodeLayers
      );
      if (err2) {
        printError("cutPasteNode: cannot create new center", {
          err: err2,
          parent,
          "state.tree.mapNodeLayers": state.tree.mapNodeLayers
        });
        return;
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
      };
      if (changedNode) {
        const [normalizedChangedCenter] = convertPosition(
          "normalize",
          changedNode.position,
          v.parentID,
          state.tree.mapNodeLayers
        );
        updateMap[`map/${changedNode.id}/position`] = normalizedChangedCenter;
      }
      await api.update(updateMap);

      commit(`history/${historyMutations.ADD_CUT_PASTE}`, {
        nodeID: v.nodeID,
        parentID: v.parentID
      });
    },

    /**
     *
     * @param commit
     * @param state
     * @param nodeID
     */
    async [actions.removeNode](
      { commit, state }: { commit: Commit; state: State },
      nodeID: string
    ) {
      const parent = state.tree.nodeRecord[nodeID].parent;
      if (!parent) {
        return;
      }
      const parentID = parent.id;
      const node = (await api.getNode(nodeID)) as DBNode;
      // collect all children id recursively
      const allChildrenID = clone(node.children);
      const allChildrenIDMap = {} as Record<string, DBNode>;
      while (allChildrenID.length > 0) {
        const id = allChildrenID.pop();
        if (
          !id ||
          !state.tree.nodeRecord[id!] ||
          !state.tree.nodeRecord[id!].node ||
          !state.tree.nodeRecord[id!].parent
        ) {
          continue;
        }
        allChildrenIDMap[id] = {
          id: id,
          parentID: state.tree.nodeRecord[id].parent!.id,
          name: state.tree.nodeRecord[id].node.title,
          children: state.tree.nodeRecord[id].node.children.map(
            node => node.id
          ),
          position: state.tree.nodeRecord[id].node.position
        };
        allChildrenID.push(
          ...state.tree.nodeRecord[id].node.children.map(node => node.id)
        );
      }
      // move node and its children to /trash atomically
      const moveToTrash = {} as Record<string, any>;
      const oldKey = await api.findKeyOfChild(parent.id, nodeID);
      moveToTrash[`trash/${nodeID}/map`] = node;
      moveToTrash[`map/${nodeID}`] = null;
      moveToTrash[`map/${parent.id}/children/${oldKey}`] = null;
      if (state.nodeContent.nodeContents[nodeID]) {
        moveToTrash[`trash/${nodeID}/node_content`] =
          state.nodeContent.nodeContents[nodeID];
        moveToTrash[`node_content/${nodeID}`] = null;
      }
      if (state.precondition.preconditions[nodeID]) {
        moveToTrash[`trash/${nodeID}/precondition`] =
          state.precondition.preconditions[nodeID];
        moveToTrash[`precondition/${nodeID}`] = null;
      }

      // move also all children to /trash
      for (const id in allChildrenIDMap) {
        moveToTrash[`trash/${id}/map`] = allChildrenIDMap[id];
        moveToTrash[`map/${id}`] = null;
        if (state.nodeContent.nodeContents[id]) {
          moveToTrash[`trash/${id}/node_content`] =
            state.nodeContent.nodeContents[id];
          moveToTrash[`node_content/${id}`] = null;
        }
        if (state.precondition.preconditions[id]) {
          moveToTrash[`trash/${id}/precondition`] =
            state.precondition.preconditions[id];
          moveToTrash[`precondition/${id}`] = null;
        }
      }

      await api.update(moveToTrash);

      commit(`history/${historyMutations.ADD_REMOVE}`, {
        parentNodeID: parentID,
        nodeID: nodeID
      });
    },

    /**
     *
     * @param commit
     * @param state
     * @param v
     */
    [actions.updateNodePosition](
      { commit, state }: { commit: Commit; state: State },
      v: { nodeId: string; delta: Point }
    ) {
      if (!state.editModeOn) {
        return;
      }
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
    }
  },
  modules: {
    pin: pinStore,
    titleBox: titleBoxStore,
    precondition: preconditionStore,
    positionChangePermits: positionChangePermitsStore,
    tree: treeStore,
    user: userStore,
    zoomPan: zoomPanStore,
    history: historyStore,
    nodeContent: nodeContentStore,
    searchResult: searchResultStore
  }
});

// define your own `useStore` composition function
export function useStore() {
  return baseUseStore(key);
}
