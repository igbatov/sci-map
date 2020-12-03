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

export default Vuex.createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {}
});
