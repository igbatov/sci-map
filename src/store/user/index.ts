import firebase from "firebase";
import api from "@/api/api";
import { Commit } from "vuex";

export interface State {
  user: firebase.User | null;
}

export const mutations = {
  SET_USER: "SET_USER"
};
export const actions = {
  init: "init",
  signIn: "signIn",
  signOut: "signOut"
};

export const store = {
  namespaced: true,
  state: {
    user: null
  },
  mutations: {
    [mutations.SET_USER](state: State, user: firebase.User) {
      console.log(user);
      state.user = user;
    }
  },
  actions: {
    async [actions.init]({ commit }: { commit: Commit }) {
      api.initFirebase();
      const user = await api.getCurrentUser();
      commit(mutations.SET_USER, user);
    },

    async [actions.signIn]({ commit }: { commit: Commit }) {
      await firebase
        .auth()
        .signInWithPopup(new firebase.auth.GoogleAuthProvider());
      const user = await api.getCurrentUser();
      commit(mutations.SET_USER, user);
    },

    async [actions.signOut]({ commit }: { commit: Commit }) {
      await firebase.auth().signOut();
      commit(mutations.SET_USER, null);
    }
  }
};
