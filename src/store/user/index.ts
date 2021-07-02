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
      state.user = user;
    }
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
    }
  }
};
