/**
 * Store to track current visible level
 */
import Vue from "vue";

export const Init = "Init";
export const UpdateCurrentLevel = "UpdateCurrentLevel";

const LEVEL_THRESHOLD = 1;

export default {
  namespaced: true,
  state: {
    prevRootWH: { width: 0, height: 0 },
    currentTreeItemStack: [],
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
    PUSH_CURRENT_TREE_ITEM_STACK(state, treeItemId) {
      state.currentTreeItemStack.push(treeItemId);
    },
    POP_CURRENT_TREE_ITEM_STACK(state) {
      state.currentTreeItemStack.pop();
    },
    SET_CURRENT_ROOT_WH(state, wh) {
      state.prevRootWH = wh;
    }
  },
  getters: {
    GetCurrentLevel(state) {
      return state.currentTreeItemStack.length;
    },
    GetCurrentTreeItemStack(state) {
      return state.currentTreeItemStack;
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
    [UpdateCurrentLevel]({ commit, state, getters, rootGetters }) {
      const rootWH = rootGetters["GetRoot"].GetWH();
      // If zoom-in then check that next level is not too big
      if (rootWH.width > state.prevRootWH.width) {
        if (!state.treeItemsByLevel[getters.GetCurrentLevel + 1]) {
          return;
        }
        const maxVisibleContainer = getMaxVisibleContainer(
          state.treeItemsByLevel[getters.GetCurrentLevel + 1]
        );
        if (maxVisibleContainer.squarePercent >= LEVEL_THRESHOLD) {
          commit("PUSH_CURRENT_TREE_ITEM_STACK", maxVisibleContainer.id);
        }
      }
      // If zoom-out then check that this level is not too small
      if (rootWH.width < state.prevRootWH.width) {
        if (getters.GetCurrentLevel < 0) {
          return;
        }
        const maxVisibleContainer = getMaxVisibleContainer(
          state.treeItemsByLevel[getters.GetCurrentLevel]
        );
        if (maxVisibleContainer.squarePercent < LEVEL_THRESHOLD) {
          commit("POP_CURRENT_TREE_ITEM_STACK");
        }
      }
      commit("SET_CURRENT_ROOT_WH", {
        width: rootWH.width,
        height: rootWH.height
      });
    },
    UpdateLevelItems({ commit, rootState }) {
      commit("CLEAN_LEVEL_ITEMS");
      Object.keys(rootState.treeItems).forEach(id => {
        const treeItem = rootState.treeItems[id];
        commit("ADD_TREE_ITEM", { level: treeItem.GetLevel(), item: treeItem });
      });
    }
  }
};

const getMaxVisibleContainer = items => {
  const maxVisibleContainer = {
    squarePercent: 0,
    id: 0
  };
  for (let item of items) {
    // calc percent this items occupies on viewport
    const xy = item.GetAbsoluteXY();
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
    if (squarePercent > maxVisibleContainer.squarePercent) {
      maxVisibleContainer.squarePercent = squarePercent;
      maxVisibleContainer.id = item.id;
    }
  }

  return maxVisibleContainer;
};
