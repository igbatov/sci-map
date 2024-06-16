export interface State {
  searchString: string;
  nodeIDs: string[];
}

export const mutations = {
  SET_SEARCH_STRING: "SET_SEARCH_STRING",
  SET_NODE_IDS: "SET_NODE_IDS"
};

export const store = {
  namespaced: true,
  state: {
    searchString: "",
    nodeIDs: []
  },
  mutations: {
    [mutations.SET_SEARCH_STRING](state: State, searchString: string) {
      state.searchString = searchString;
    },

    [mutations.SET_NODE_IDS](state: State, nodeIDs: Array<string>) {
      // show only the first 20 results
      if (nodeIDs.length > 20) {
        // TODO: show notification that only first 20 results are shown
        state.nodeIDs = nodeIDs.slice(0, 20);
      } else {
        state.nodeIDs = nodeIDs;
      }
    }
  }
};
