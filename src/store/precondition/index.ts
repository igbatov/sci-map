
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
};

export const store = {
  namespaced: true,
  state: {
    preconditions: {} as Record<string, string[]>,
    reverseIndex: {} as Record<string, string[]>
  },
  mutations: {
    [mutations.SET_PRECONDITIONS](state: State, preconditions: Preconditions) {
      state.preconditions = preconditions;

      // create reverseIndex
      for (const id in preconditions) {
        for (const precondID of preconditions[id]) {
          if (typeof state.reverseIndex[precondID] === 'undefined') {
            state.reverseIndex[precondID] = []
          }
          state.reverseIndex[precondID].push(id)
        }
      }
    },
    [mutations.UPDATE_PRECONDITIONS](
      state: State,
      v: { nodeID: string; preconditionIDs: Array<string> }
    ) {
      if (!state.preconditions[v.nodeID]) {
        state.preconditions[v.nodeID] = [];
      }
      // remove from reverseIndex old preconditions
      for (const id of state.preconditions[v.nodeID]) {
        if (state.reverseIndex[id] && state.reverseIndex[id].indexOf(v.nodeID) != -1) {
          state.reverseIndex[id].splice(state.reverseIndex[id].indexOf(v.nodeID), 1)
        }
      }

      state.preconditions[v.nodeID] = v.preconditionIDs;

      // add to reverseIndex new preconditions
      for (const precondID of state.preconditions[v.nodeID]) {
        if (typeof state.reverseIndex[precondID] === 'undefined') {
          state.reverseIndex[precondID] = []
        }
        state.reverseIndex[precondID].push(v.nodeID)
      }
    },
  }
};
