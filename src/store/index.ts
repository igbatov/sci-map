import { Commit, createStore, Store, useStore as baseUseStore } from "vuex";
import { InjectionKey } from "vue";
import {
  store as treeStore,
  State as TreeState,
} from "./tree";
import {
  store as userStore,
  State as UserState,
  mutations as userMutations
} from "./user";
import api from "@/api/api";
import { fetchMap } from "./helpers";

export type State = {
  tree: TreeState;
  user: UserState;
};

export const actions = {
  init: "init"
};

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  actions: {
    async [actions.init]({ commit }: { commit: Commit }) {
      api.initFirebase();
      const user = await api.getCurrentUser();
      commit(`user/${userMutations.SET_USER}`, user);
      await fetchMap(user);
    }
  },
  modules: {
    tree: treeStore,
    user: userStore
  }
});

// reactively change tree based on user change
store.watch(state => state.user.user, fetchMap);

// define your own `useStore` composition function
export function useStore() {
  return baseUseStore(key);
}
