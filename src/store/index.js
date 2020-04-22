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
  constructor({id, title, parent, children}) {
    this.id = id;
    this.title = title;
    this.parent = parent;
    this.children = children;
  }

  IsLastChild(id) {
    return this.children && this.children.length && this.children[this.children.length - 1] === id
  }

  GetWH() {
    return this.parent.GetChildrenWH(this.id)
  }

  GetXY() {
    return this.parent.GetChildrenXY(this.id)
  }

  GetChildrenWH(id) {
    const wh = this.GetWH();
    const width = wh.width;
    const height = wh.height;
    const childrenLength = this.children.length;
    let grid = getGrid(childrenLength, width, height);
    let childWidth = width/grid.rowNum;
    // if this is last index, stretch children till end of raw
    if (childrenLength % grid.rowNum !== 0 && this.IsLastChild(id)) {
      childWidth = childWidth * (1 + grid.rowNum - childrenLength % grid.rowNum);
    }
    const childHeight = height/grid.colNum;
    return {
      width: childWidth,
      height: childHeight,
    };
  }

  GetChildrenXY(id) {
    const wh = this.GetWH();
    let grid = getGrid(this.children.length, wh.width, wh.height);
    const childWH = this.GetChildrenWH(this.children[0]);
    const index = this.children.indexOf(id);
    return {
      x: index % grid.rowNum * childWH.width,
      y: Math.floor(index/grid.rowNum)*childWH.height,
    }
  }
}

class RootTreeItem extends TreeItem {
  constructor({id, title, parent, children, width, height, x, y}) {
    super({id, title, parent, children});
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
  }

  GetWH() {
    return {
      width: this.width,
      height: this.height,
    };
  }

  GetXY() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  SetXY({x, y}) {
    this.x = x;
    this.y = y;
  }

  SetWH({width, height}) {
    this.width = width;
    this.height = height;
  }
}

export default new Vuex.Store({
  state: {
    rootId: 0,
    treeItems: {},
  },
  getters: {
    [GetRoot](state) {
      return state.treeItems[state.rootId];
    },
    [GetNode](state) {
      return (id) => (state.treeItems[id])
    },
  },
  mutations: {
    [SET_ROOT_WH](state, wh) {
      state.treeItems[state.rootId].SetWH({width: wh.width, height: wh.height});
    },
    [SET_ROOT_XY](state, xy) {
      state.treeItems[state.rootId].SetXY({x: xy.x, y: xy.y});
    },
    SET_ROOT_ID(state, id) {
      state.rootId = id;
    },
    ADD_TREE_ITEM(state, item) {
      Vue.set(state.treeItems, item.id, item);
    },
  },
  actions: {
    [StoreFlatMap]({ commit }) {
      const mapHash = treeToHash(map);
      let stack = [];
      const root = new RootTreeItem({
        id: map.root.id,
        title: map.root.title,
        children: map.root.children.map((child)=>(child.id)),
        width: window.innerWidth,
        height: window.innerHeight,
        x: 0,
        y: 0,
      });
      commit('ADD_TREE_ITEM', root);
      commit('SET_ROOT_ID', map.root.id);
      stack.push(root);
      while (stack.length > 0) {
        const parent = stack.pop();
        if (!parent.children) {
          continue;
        }
        parent.children.forEach((nodeId) => {
          const node = mapHash[nodeId];
          const treeItem = new TreeItem({
            id: nodeId,
            title: node.title,
            parent: parent,
            children: node.children.map((child)=>(child.id)),
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

const getGrid = (itemsNum, width, height) => {
  let rowLength = itemsNum;
  if (rowLength < 2) {
    return {
      rowNum: 1,
      colNum: 1,
    }
  }
  let colLength = 1;
  let parentWidth = width;
  let parentHeight = height;

  let itemHeight = parentHeight/colLength;
  let itemWidth = parentWidth/rowLength;
  while (itemHeight/itemWidth > 1) {
    colLength++;
    rowLength = Math.ceil(itemsNum / colLength);
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
        rowLength = Math.ceil(itemsNum / colLength);
      }
    } else {
      colLength++;
      rowLength = Math.ceil(itemsNum / colLength);
    }
  }

  return {
    rowNum: rowLength,
    colNum: colLength,
  }
}

