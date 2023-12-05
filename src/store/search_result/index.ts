
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
      console.log(nodeIDs)

      state.nodeIDs = nodeIDs;
    },
  },
}
