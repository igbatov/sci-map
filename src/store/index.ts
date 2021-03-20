import { Commit, createStore, Store, useStore as baseUseStore } from "vuex";
import { InjectionKey } from "vue";
import { store as pinStore, State as PinState } from "./pin";
import { store as treeStore, State as TreeState } from "./tree";
import { store as zoomPanStore, State as ZoomPanState } from "./zoom_pan";
import {
  store as userStore,
  State as UserState,
  mutations as userMutations
} from "./user";
import api from "@/api/api";
import { fetchMap, fetchPins } from "./helpers";

export type State = {
  pin: PinState;
  tree: TreeState;
  user: UserState;
  zoomPan: ZoomPanState;
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
      await fetchPins(user);
    }
  },
  modules: {
    pin: pinStore,
    tree: treeStore,
    user: userStore,
    zoomPan: zoomPanStore
  }
});

// reactively change tree based on user change
store.watch(state => state.user.user, fetchMap);
// reactively change pins based on user change
store.watch(state => state.user.user, fetchPins);

// define your own `useStore` composition function
export function useStore() {
  return baseUseStore(key);
}
