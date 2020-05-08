/**
 * Main store that maintain flat tree and set zoom and position
 */
import Vue from "vue";
import Vuex from "vuex";
import { TreeItem, RootTreeItem } from "./classes";
import { treeToHash, fixSingleChild } from "./utils";
import level from "./level";
import title from "./title";

export const SET_ROOT_WH = "SET_ROOT_WH";
export const SET_ROOT_XY = "SET_ROOT_XY";
export const InitFlatMap = "InitFlatMap";
export const GetRoot = "GetRoot";
export const GetNode = "GetNode";

const map = require("../assets/map.json");
map.root.title = "";
map.root.children = map.root.children.sort((a,b) => (a.pos[1] > b.pos[1]) ? 1 : ((b.pos[1] > a.pos[1]) ? -1 : 0));
// const map = {
//   root: {
//     id: 0,
//     title: "0",
//     children: [
//       {
//         id: 1,
//         title: "1",
//         children: [],
//       },
//       {
//         id: 2,
//         title: "2",
//         children: [],
//       },
//     ],
//   }
// }
console.log(map);
Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    rootId: 0,
    treeItems: {}
  },
  getters: {
    [GetRoot](state) {
      return state.treeItems[state.rootId];
    },
    [GetNode](state) {
      return id => state.treeItems[id];
    }
  },
  mutations: {
    [SET_ROOT_WH](state, wh) {
      state.treeItems[state.rootId].SetWH({
        width: wh.width,
        height: wh.height
      });
    },
    [SET_ROOT_XY](state, xy) {
      state.treeItems[state.rootId].SetXY({ x: xy.x, y: xy.y });
    },
    SET_ROOT_ID(state, id) {
      state.rootId = id;
    },
    ADD_TREE_ITEM(state, item) {
      Vue.set(state.treeItems, item.id, item);
    }
  },
  actions: {
    [InitFlatMap]({ commit }) {
      const fixedMap = fixSingleChild(map);
      const mapHash = treeToHash(fixedMap);
      let stack = [];
      const root = new RootTreeItem({
        id: map.root.id,
        title: map.root.title,
        children: map.root.children.map(child => child.id),
        width: window.innerWidth,
        height: window.innerHeight,
        x: 0,
        y: 0
      });
      commit("ADD_TREE_ITEM", root);
      commit("SET_ROOT_ID", map.root.id);
      stack.push(root);
      while (stack.length > 0) {
        const parent = stack.pop();
        if (!parent.children) {
          continue;
        }
        parent.children.forEach(nodeId => {
          const node = mapHash[nodeId];
          const treeItem = new TreeItem({
            id: nodeId,
            title: node.title,
            parent: parent,
            children: node.children.map(child => child.id)
          });
          commit("ADD_TREE_ITEM", treeItem);
          stack.push(treeItem);
        });
      }
    }
  },
  modules: {
    level,
    title
  }
});
