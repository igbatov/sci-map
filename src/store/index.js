import Vue from "vue";
import Vuex from "vuex";

export const SET_ROOT_WH = 'SET_ROOT_WH';
export const SET_ROOT_XY = 'SET_ROOT_XY';
export const StoreFlatMap = 'StoreFlatMap';
export const GetRoot = 'GetRoot';
export const GetNode = 'GetNode';

const map = require("../assets/map.json");
map.root.title = "";
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

Vue.use(Vuex);

class TreeItem {
  constructor({id, title, width, height, x, y, children}) {
    this.id = id;
    this.title = title;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.children = children;
  }

  GetChildrenWH(index) {
    let grid = this.grid();
    let width = this.width/grid.rowNum;
    // if this is last index, stretch children till end of raw
    if (this.children.length % grid.rowNum !== 0 && index === this.children.length - 1) {
      width = width * (1 + grid.rowNum - this.children.length % grid.rowNum);
    }
    const height = this.height/grid.colNum;
    return {
      width: width,
      height: height,
    };
  }

  GetChildrenXY(index) {
    const grid = this.grid();
    const itemWH = this.GetChildrenWH();
    return {
      x: index % grid.rowNum * itemWH.width,
      y: Math.floor(index/grid.rowNum)*itemWH.height,
    }
  }

  grid() {
    let rowLength = this.children.length;
    if (rowLength < 2) {
      return {
        rowNum: 1,
        colNum: 1,
      }
    }
    let colLength = 1;
    let parentWidth = this.width;
    let parentHeight = this.height;

    let itemHeight = parentHeight/colLength;
    let itemWidth = parentWidth/rowLength;
    while (itemHeight/itemWidth > 1) {
      colLength++;
      rowLength = Math.ceil(this.children.length / colLength);
      itemHeight = parentHeight / colLength;
      itemWidth = parentWidth / rowLength;
    }

    // make sure number of rows is even number (for better parent title visibility)
    if (colLength % 2 !== 0) {
      if (rowLength === 1) {
        if (colLength === 1) {
          console.error("Node must have at least 2 children!")
        } else {
          colLength--;
          rowLength = Math.ceil(this.children.length / colLength);
        }
      } else {
        colLength++;
        rowLength = Math.ceil(this.children.length / colLength);
      }
    }

    return {
      rowNum: rowLength,
      colNum: colLength,
    }
  }
}

export default new Vuex.Store({
  state: {
    rootWH: {width:0, height:0},
    rootXY: {x:0, y:0},
    treeItems: {},
  },
  getters: {
    [GetRoot](state) {
      return state.treeItems[map.root.id];
    },
    [GetNode](state) {
      return (id) => (state.treeItems[id])
    },
  },
  mutations: {
    [SET_ROOT_WH](state, wh) {
      state.rootWH.width = wh.width;
      state.rootWH.height = wh.height;
    },
    [SET_ROOT_XY](state, xy) {
      state.rootXY.x = xy.x;
      state.rootXY.y = xy.y;
    },
    ADD_TREE_ITEM(state, item) {
      Vue.set(state.treeItems, item.id, item);
    },
  },
  actions: {
    [StoreFlatMap]({ state, commit }) {
      const mapHash = treeToHash(map);
      let stack = [];
      const root = new TreeItem({
        id:map.root.id,
        title: map.root.title,
        children: map.root.children.map((child)=>(child.id)),
        width: state.rootWH.width,
        height: state.rootWH.height,
        x: state.rootXY.x,
        y: state.rootXY.y,
      });
      commit('ADD_TREE_ITEM', root);
      stack.push(root);
      while (stack.length > 0) {
        const parent = stack.pop();
        if (!parent.children) {
          continue;
        }
        parent.children.forEach((nodeId, index) => {
          const node = mapHash[nodeId];
          const chWH = parent.GetChildrenWH(index);
          const chXY = parent.GetChildrenXY(index);
          const treeItem = new TreeItem({
            id: nodeId,
            parent: parent.id,
            children: node.children.map((child)=>(child.id)),
            title: node.title,
            width: chWH.width,
            height: chWH.height,
            x: chXY.x,
            y: chXY.y,
          });
          commit('ADD_TREE_ITEM', treeItem);
          stack.push(treeItem);
        });
      }
    }
  },
  modules: {}
});

const treeToHash = (tree) => {
  let hash = {};
  let stack = [];
  stack.push(tree.root);
  while (stack.length > 0) {
    const node = stack.pop();
    hash[node.id] = node;
    node.children.forEach((child) => {
      stack.push(child);
    });
  }

  return hash;
};

