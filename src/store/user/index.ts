import firebase from "firebase/compat";
import { Commit } from "vuex";
import api from "@/api/api";

export interface State {
  user: firebase.User | null;
  subscribePeriod: string;
}

export const mutations = {
  SET_USER: "SET_USER",
  SET_SUBSCRIBE_PERIOD: "SET_SUBSCRIBE_PERIOD"
};
export const actions = {
  signIn: "signIn",
  signOut: "signOut",
  setSubscribePeriod: "setSubscribePeriod",
};

export const store = {
  namespaced: true,
  state: {
    user: null,
    subscribePeriod: '',
  },
  mutations: {
    [mutations.SET_USER](state: State, user: firebase.User) {
      state.user = user;
    },
    [mutations.SET_SUBSCRIBE_PERIOD](state: State, subscribePeriod: string) {
      state.subscribePeriod = subscribePeriod;
    },
  },
  actions: {
    async [actions.signIn]({ commit }: { commit: Commit }) {
      await firebase
        .auth()
        .signInWithPopup(new firebase.auth.GoogleAuthProvider());
    },

    async [actions.signOut]({ commit }: { commit: Commit }) {
      await firebase.auth().signOut();
      commit(mutations.SET_USER, null);
    },

    async [actions.setSubscribePeriod]({ commit, state }: { commit: Commit; state: State }, period: string) {
      if (!state.user) {
        return
      }
      commit(mutations.SET_SUBSCRIBE_PERIOD, period);
      await api.setUserSubscribePeriod(state.user, period);
    }
  }
};
