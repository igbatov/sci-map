/**
 * Store that maintains title width and height
 */
import Vue from "vue";
import { GetNode } from "./index";

const MaxVisibleLevel = 3;

export default {
  namespaced: true,
  state: {
    titles: {}
  },
  mutations: {
    SET_TITLE_WH(state, { nodeId, width, height }) {
      Vue.set(state.titles, nodeId, { width: width, height: height });
    }
  },
  getters: {
    GetIsVisible(state, getters, rootState, rootGetters) {
      return nodeId => {
        const titleWH = state.titles[nodeId];
        if (!titleWH) {
          return true;
        }

        const node = rootGetters[GetNode](nodeId);

        if (node.GetLevel() <= rootGetters["level/GetCurrentLevel"] ||
        node.GetLevel() > rootGetters["level/GetCurrentLevel"] + MaxVisibleLevel) {
          return false;
        }

        return true;
      };
    },
    GetTitleWH(state) {
      return nodeId => {
        return state.titles[nodeId];
      };
    }
  }
};
