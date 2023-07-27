import { Commit } from "vuex";
import { NodeRecordItem } from "@/store/tree";

export type Pins = Record<
  string /* node_id of pinned node */,
  string[] /* list of parents where this node_id is visible */
>;

export interface State {
  pins: Pins;
  pinsReverse: Record<
    string /* node_id of node where some pinned nodes must be visible */,
    string[] /* array of pins (= node ids) that is visible in this node_id */
  >;
}

export const mutations = {
  SET_PINS: "SET_PINS",
  ADD_TO_PINS: "ADD_TO_PINS",
  REMOVE_PIN: "REMOVE_PIN",
  ADD_TO_PINS_REVERSE: "ADD_TO_PINS_REVERSE"
};

export const actions = {
  AddPin: "AddPin",
  RemovePin: "RemovePin"
};

export const store = {
  namespaced: true,
  state: {
    pins: {},
    pinsReverse: {}
  },
  actions: {
    // had to use action instead of mutation to get access to rootState https://github.com/vuejs/vuex/issues/344
    [actions.AddPin](
      {
        commit,
        rootState
      }: {
        commit: Commit;
        rootState: { tree: { nodeRecord: Record<string, NodeRecordItem> } };
      },
      v: { nodeId: string; parentId: string }
    ) {
      // get all parents of nodeId until parentID
      let currentParent = rootState.tree.nodeRecord[v.nodeId].parent;
      if (!currentParent) {
        return;
      }
      const parentIds = [];
      while (currentParent && currentParent.id != v.parentId) {
        parentIds.push(currentParent.id);
        currentParent = rootState.tree.nodeRecord[currentParent.id].parent;
      }
      parentIds.push(v.parentId);
      // Set them to pins
      commit(mutations.ADD_TO_PINS, { nodeId: v.nodeId, parentIds });

      // And for each parent add pined node id to it
      for (const parentId of parentIds) {
        commit(mutations.ADD_TO_PINS_REVERSE, {
          nodeId: parentId,
          pinId: v.nodeId
        });
      }
    },
    [actions.RemovePin]({ commit }: { commit: Commit }, nodeId: string) {
      commit(mutations.REMOVE_PIN, nodeId);
    }
  },
  mutations: {
    [mutations.SET_PINS](state: State, pins: Pins) {
      state.pins = pins;
      state.pinsReverse = {};
      for (const pinId in pins) {
        for (const parentId of pins[pinId]) {
          if (!state.pinsReverse[parentId]) {
            state.pinsReverse[parentId] = [];
          }
          state.pinsReverse[parentId].push(pinId);
        }
      }
    },
    [mutations.ADD_TO_PINS](state: State, v: { nodeId: string; parentIds: string[] }) {
      state.pins[v.nodeId] = v.parentIds;
    },
    [mutations.ADD_TO_PINS_REVERSE](state: State, v: { nodeId: string; pinId: string }) {
      if (!state.pinsReverse[v.nodeId]) {
        state.pinsReverse[v.nodeId] = [];
      }
      state.pinsReverse[v.nodeId].push(v.pinId);
    },
    [mutations.REMOVE_PIN](state: State, nodeId: string) {
      for (const parentId of state.pins[nodeId]) {
        const index = state.pinsReverse[parentId].indexOf(nodeId);
        state.pinsReverse[parentId].splice(index, 1);
      }
      delete state.pins[nodeId];
    }
  }
};
