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
    parents: {},
  },
  actions: {
    [actions.AddPrecondition](
      {
        commit,
      }: {
        commit: Commit;
      },
      v: { nodeId: string; parentId: string }
    ) {
      console.log("going to add premise", v.nodeId, " to node ", v.parentId)
      commit(mutations.ADD_TO_PRECONDITIONS, { nodeId: v.nodeId, preconditionId: v.parentId });
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
    SET_PRECONDITIONS(state: State, preconditions: Preconditions) {
      state.preconditions = preconditions;
    },
    ADD_TO_PRECONDITIONS(state: State, v: { nodeId: string; preconditionId: string }) {
      state.preconditions[v.nodeId].push(v.preconditionId);
    },
    REMOVE_FROM_PRECONDITIONS(state: State, v: { nodeId: string; preconditionId: string }) {
      const p = state.preconditions[v.nodeId]
      delete p[p.indexOf(v.preconditionId)]
    },
  },
};
