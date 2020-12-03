/**
 * Main store that maintain flat tree and set zoom and position
 */
import Vue from "vue";
import Vuex from "vuex";

const map = require("../assets/map.json");
map.root.title = "";
map.root.children = map.root.children.sort((a, b) =>
  a.pos[1] > b.pos[1] ? 1 : b.pos[1] > a.pos[1] ? -1 : 0
);
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
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {}
});
