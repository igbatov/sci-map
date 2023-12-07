
export interface State {
  nodeIDs: string[];
}

export const mutations = {
  SET_NODE_IDS: "SET_NODE_IDS",
};

export const store = {
  namespaced: true,
  state: {
    nodeIDs: []
  },
  mutations: {
    [mutations.SET_NODE_IDS](state: State, nodeIDs: Array<string>) {
      // show only first 20 results
      if (nodeIDs.length>20) {
        // TODO: show notification that only first 20 results are shown
        state.nodeIDs = nodeIDs.slice(0, 20)
      } else {
        state.nodeIDs = nodeIDs;
      }
    },
  },
}
