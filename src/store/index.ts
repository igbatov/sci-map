import { createStore, Store, useStore as baseUseStore } from "vuex";
import { InjectionKey } from "vue";
import { store as tree, State as TreeState } from "./tree";
import { store as user, State as UserState } from "./user";

export type State = {
  tree: TreeState;
  user: UserState;
};

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  modules: {
    tree,
    user
  }
});

// define your own `useStore` composition function
export function useStore() {
  return baseUseStore(key);
}
