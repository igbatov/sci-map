import { Point, Tree } from "@/types/graphics";

import { InjectionKey } from "vue";
import { createStore, useStore as baseUseStore, Store } from "vuex";

export interface State {
  root: Tree | {};
  nodeMap: Record<number, Tree>;
}

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  state: {
    root: {},
    nodeMap: {} // id=>node
  },
  getters: {
    getTree(state: State): Tree | {} {
      return state.root;
    }
  },
  mutations: {
    init(state: State, tree: Tree) {
      state.root = tree;

      // traverse tree and fill in nodeMap
      const stack = [tree];
      while (stack.length) {
        const node = stack.pop();
        if (!node) {
          break;
        }
        state.nodeMap[node.id] = node;
        stack.push(...node.children);
      }
    },
    updateNodePosition(state: State, v: { nodeId: number; position: Point }) {
      state.nodeMap[v.nodeId].position = v.position;
    }
  }
});

// define your own `useStore` composition function
export function useStore() {
  return baseUseStore(key);
}
