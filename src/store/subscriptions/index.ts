import { Commit } from "vuex";
import firebase from "firebase/compat";
import api from "@/api/api";

export type Subscriptions = Record<
  string /* node_id user is subscribed on */,
  number
>;

export interface State {
  subscriptions: Subscriptions;
}

export const mutations = {
  SET_SUBSCRIPTIONS: "SET_SUBSCRIPTIONS",
  SET_SUBSCRIPTION: "SET_SUBSCRIPTION",
};

export const actions = {
  ToggleSubscription: "ToggleSubscription",
};

export const store = {
  namespaced: true,
  state: {
    subscriptions: {},
  },
  actions: {
    /**
     * ToggleSubscription
     * @param commit
     * @param state
     * @param rootState
     * @param nodeID
     */
    [actions.ToggleSubscription](
      {
        commit, state, rootState
      }: {
        commit: Commit;
        state: State;
        rootState: { user: { user: firebase.User | null } };
      },
      nodeID: string
    ) {
      const v = {nodeID: nodeID, mode: 0} as {nodeID: string, mode: number | null}
      if (!state.subscriptions[nodeID] || state.subscriptions[nodeID] == 0) {
        v.mode = 1
      } else if (state.subscriptions[nodeID] == 1) {
        v.mode = null
      }
      commit(mutations.SET_SUBSCRIPTION, v);
      api.setSubscription(rootState.user.user, v);
    },
  },
  mutations: {
    /**
     * SET_SUBSCRIPTIONS
     * @param state
     * @param subscriptions
     */
    [mutations.SET_SUBSCRIPTIONS](state: State, subscriptions: Subscriptions) {
      if (!subscriptions) {
        state.subscriptions = {};
      } else {
        state.subscriptions = subscriptions
      }
    },

    /**
     * SET_SUBSCRIPTION
     * @param state
     * @param v
     */
    [mutations.SET_SUBSCRIPTION](
      state: State,
      v: {nodeID: string, mode: number}
    ) {
      if (v.mode>0) {
        state.subscriptions[v.nodeID] = v.mode;
      } else {
        delete state.subscriptions[v.nodeID];
      }
    },
  }
};
