/**
 * This store contains nodeIDs that is permitted to move (change positions)
 * The idea is to restrict position change only for just added nodes and its neighbours
 * Otherwise there is risk that everybody will to do little tweaks in node coordinates that will
 * sum up in constant map visual mess
 */
import {Commit, Dispatch} from "vuex";
const PERMISSION_TIMEOUT = 60*60*1000 // time after which permit is revoked (in milliseconds)

export const mutations = {
  ADD_NODES: "ADD_NODES",
  REMOVE_NODES: "REMOVE_NODES",
};

export const actions = {
  CheckNodeID: "CheckNodeID",
};

export interface State {
  permittedNodeIDs: Record<string, number> // key is nodeID, value is created_at
}

export const store = {
  namespaced: true,
  state: {
    permittedNodeIDs: {},
  },
  mutations: {
    [mutations.ADD_NODES](state: State, nodeIDs: string) {
      for (const nodeID of nodeIDs) {
        state.permittedNodeIDs[nodeID] = (new Date()).getTime()
      }
    },
    [mutations.REMOVE_NODES](state: State, nodeIDs: string) {
      for (const nodeID of nodeIDs) {
        delete state.permittedNodeIDs[nodeID]
      }
    },
  },
  actions: {
    [actions.CheckNodeID](
      { commit, state }: { commit: Commit; state: State },
      nodeID: string
    ) {
      if (!!state.permittedNodeIDs[nodeID] && (new Date()).getTime() < state.permittedNodeIDs[nodeID] + PERMISSION_TIMEOUT) {
        return true
      }
      if (state.permittedNodeIDs[nodeID]) {
        commit(mutations.REMOVE_NODES, [nodeID])
      }
      return false
    }
  }
};
