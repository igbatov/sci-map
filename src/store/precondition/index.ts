
export type Preconditions = Record<
  string /* id of node with premises */,
  string[] /* ids of premise nodes (parent nodes) */
>;

export interface State {
  preconditions: Preconditions;
}

export const mutations = {
  SET_PRECONDITIONS: "SET_PRECONDITIONS",
  UPDATE_PRECONDITIONS: "UPDATE_PRECONDITIONS",
};

export const store = {
  namespaced: true,
  state: {
    preconditions: {} as Record<string, string[]>
  },
  mutations: {
    [mutations.SET_PRECONDITIONS](state: State, preconditions: Preconditions) {
      state.preconditions = preconditions;
    },
    [mutations.UPDATE_PRECONDITIONS](
      state: State,
      v: { nodeID: string; preconditionIDs: Array<string> }
    ) {
      if (!state.preconditions[v.nodeID]) {
        state.preconditions[v.nodeID] = [];
      }
      state.preconditions[v.nodeID] = v.preconditionIDs;
    },
  }
};
