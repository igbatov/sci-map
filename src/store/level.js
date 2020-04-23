import Vue from "vue";

export const Init = "Init";
export const UpdateCurrentLevel = "UpdateCurrentLevel";

export default {
  namespaced: true,
  state: {
    currentRootWH: { width: 0, height: 0 },
    currentLevel: 0,
    treeItemsByLevel: {}
  },
  mutations: {
    CLEAN_LEVEL_ITEMS(state) {
      state.treeItemsByLevel = [];
    },
    ADD_TREE_ITEM(state, { level, item }) {
      if (!state.treeItemsByLevel[level]) {
        Vue.set(state.treeItemsByLevel, level, []);
      }
      state.treeItemsByLevel[level].push(item);
    },
    SET_CURRENT_LEVEL(state, v) {
      console.log(v);
      state.currentLevel = v;
    },
    SET_CURRENT_ROOT_WH(state, wh) {
      state.currentRootWH = wh;
    }
  },
  getters: {
    GetCurrentLevel(state) {
      return state.currentLevel;
    }
  },
  actions: {
    [Init]({ dispatch, rootGetters, commit }) {
      const rootWH = rootGetters["GetRoot"].GetWH();
      commit("SET_CURRENT_ROOT_WH", {
        width: rootWH.width,
        height: rootWH.height
      });
      dispatch("UpdateLevelItems");
    },
    [UpdateCurrentLevel]({ commit, state, rootGetters }) {
      const rootWH = rootGetters["GetRoot"].GetWH();
      // If zoom-in then check that next level is not too big
      if (rootWH.width > state.currentRootWH.width) {
        if (!state.treeItemsByLevel[state.currentLevel + 1]) {
          return;
        }
        const maxSquarePercent = getMaxVisibleSquare(
          state.treeItemsByLevel[state.currentLevel + 1]
        );
        if (maxSquarePercent > 0.4) {
          commit("SET_CURRENT_LEVEL", state.currentLevel + 1);
        }
      }
      // If zoom-out then check that this level is not too small
      if (rootWH.width < state.currentRootWH.width) {
        const maxSquarePercent = getMaxVisibleSquare(
          state.treeItemsByLevel[state.currentLevel]
        );
        if (maxSquarePercent <= 0.4) {
          commit("SET_CURRENT_LEVEL", state.currentLevel - 1);
        }
      }
      commit("SET_CURRENT_ROOT_WH", {
        width: rootWH.width,
        height: rootWH.height
      });
    },
    UpdateLevelItems({ commit, state, rootState }) {
      commit("CLEAN_LEVEL_ITEMS");
      Object.keys(rootState.treeItems).forEach(id => {
        const treeItem = rootState.treeItems[id];
        commit("ADD_TREE_ITEM", { level: treeItem.GetLevel(), item: treeItem });
      });
      console.log(state.treeItemsByLevel);
    }
  }
};

const getMaxVisibleSquare = items => {
  let maxSquarePercent = 0;
  for (let item of items) {
    // calc percent this items occupies on viewport
    const xy = item.GetXY();
    const wh = item.GetWH();
    if (
      xy.x > window.innerWidth ||
      xy.y > window.innerHeight ||
      xy.x + wh.width < 0 ||
      xy.y + wh.height < 0
    ) {
      continue;
    }
    const visibleWidth =
      Math.min(xy.x + wh.width, window.innerWidth) - Math.max(xy.x, 0);
    const visibleHeight =
      Math.min(xy.y + wh.height, window.innerHeight) - Math.max(xy.y, 0);
    const squarePercent =
      (visibleWidth * visibleHeight) / (window.innerHeight * window.innerWidth);
    if (squarePercent > maxSquarePercent) {
      maxSquarePercent = squarePercent;
    }
  }

  return maxSquarePercent;
};
