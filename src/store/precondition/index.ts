export type Preconditions = Record<
  string /* id of node with premises */,
  string[] /* ids of premise nodes */
>;

export type ReverseIndex = Record<
  string /* id of node (A) */,
  string[] /* ids nodes nodes that has node A as a premise */
>;

export interface State {
  preconditions: Preconditions;
  reverseIndex: ReverseIndex; // reverse index for preconditions - i e reverseIndex[id1] as nodeID1 means that nodeID1 has id1 as its precondition
}

export const mutations = {
  SET_PRECONDITIONS: "SET_PRECONDITIONS",
  UPDATE_PRECONDITIONS: "UPDATE_PRECONDITIONS",
  REMOVE_PRECONDITION: "REMOVE_PRECONDITION"
};

export const store = {
  namespaced: true,
  state: {
    preconditions: {} as Record<string, string[]>,
    reverseIndex: {} as Record<string, string[]>
  },
  mutations: {
    /**
     * Set preconditions for all nodes
     * @param state
     * @param preconditions
     */
    [mutations.SET_PRECONDITIONS](state: State, preconditions: Preconditions) {
      state.preconditions = preconditions;
      state.reverseIndex = {};

      // create reverseIndex
      for (const id in preconditions) {
        for (const precondID of preconditions[id]) {
          if (typeof state.reverseIndex[precondID] === "undefined") {
            state.reverseIndex[precondID] = [];
          }
          state.reverseIndex[precondID].push(id);
        }
      }
    },

    /**
     * Set preconditions for one node
     * @param state
     * @param v
     */
    [mutations.UPDATE_PRECONDITIONS](
      state: State,
      v: { nodeID: string; preconditionIDs: Array<string> }
    ) {
      if (!state.preconditions[v.nodeID]) {
        state.preconditions[v.nodeID] = [];
      }
      // remove from reverseIndex old preconditions
      for (const id of state.preconditions[v.nodeID]) {
        if (
          state.reverseIndex[id] &&
          state.reverseIndex[id].indexOf(v.nodeID) != -1
        ) {
          state.reverseIndex[id].splice(
            state.reverseIndex[id].indexOf(v.nodeID),
            1
          );
        }
      }

      state.preconditions[v.nodeID] = v.preconditionIDs;

      // add to reverseIndex new preconditions
      for (const precondID of state.preconditions[v.nodeID]) {
        if (!state.reverseIndex[precondID]) {
          state.reverseIndex[precondID] = [];
        }
        state.reverseIndex[precondID].push(v.nodeID);
      }
    },

    /**
     * Remove one precondition from one node
     * @param state
     * @param v
     */
    [mutations.REMOVE_PRECONDITION](
      state: State,
      v: { nodeID: string; preconditionID: string }
    ) {
      if (!state.preconditions[v.nodeID]) {
        return;
      }

      const p = state.preconditions[v.nodeID];
      if (!p) {
        return;
      }
      if (p.indexOf(v.preconditionID) == -1) {
        return;
      }
      p.splice(p.indexOf(v.preconditionID), 1);

      // remove from reverseIndex
      if (!state.reverseIndex[v.preconditionID]) {
        return;
      }
      if (state.reverseIndex[v.preconditionID].indexOf(v.nodeID) == -1) {
        return;
      }
      state.reverseIndex[v.preconditionID].splice(
        state.reverseIndex[v.preconditionID].indexOf(v.nodeID),
        1
      );
    }
  }
};
