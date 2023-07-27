import { Commit } from "vuex";

export type Preconditions = Record<
  string /* id of node with premises */,
  string[] /* ids of premise nodes (parent nodes) */
>;

export interface State {
  preconditions: Preconditions;
}

export const mutations = {
  SET_PRECONDITIONS: "SET_PRECONDITIONS",
  ADD_TO_PRECONDITIONS: "ADD_TO_PRECONDITIONS",
  REMOVE_FROM_PRECONDITIONS: "REMOVE_FROM_PRECONDITIONS",
};

export const actions = {
  AddPrecondition: "AddPrecondition",
  RemovePrecondition: "RemovePrecondition"
};

export const store = {
  namespaced: true,
  state: {
    preconditions: {},
  },
  actions: {
    [actions.AddPrecondition](
      {
        commit,
      }: {
        commit: Commit;
      },
      v: { nodeId: string; preconditionId: string }
    ) {
      if (!v.nodeId || !v.preconditionId) {
        console.log("AddPrecondition bad arguments", "nodeId", v.nodeId, "preconditionId", v.preconditionId)
        return
      }
      commit(mutations.ADD_TO_PRECONDITIONS, v);
    },

    [actions.RemovePrecondition](
      {
        commit,
      }: {
        commit: Commit;
      },
      v: { nodeId: string; parentId: string }
    ) {
      commit(mutations.REMOVE_FROM_PRECONDITIONS, { nodeId: v.nodeId, preconditionId: v.parentId });
    }
  },
  mutations: {
    [mutations.SET_PRECONDITIONS](state: State, preconditions: Preconditions) {
      state.preconditions = preconditions;
    },
    [mutations.ADD_TO_PRECONDITIONS](state: State, v: { nodeId: string; preconditionId: string }) {
      if (!state.preconditions[v.nodeId]) {
        state.preconditions[v.nodeId] = []
      }
      state.preconditions[v.nodeId].push(v.preconditionId);
    },
    [mutations.REMOVE_FROM_PRECONDITIONS](state: State, v: { nodeId: string; preconditionId: string }) {
      const p = state.preconditions[v.nodeId]
      if (!p) {
        return
      }
      if (p.indexOf(v.preconditionId) == -1) {
        return
      }
      delete p[p.indexOf(v.preconditionId)]
    },
  },
};
