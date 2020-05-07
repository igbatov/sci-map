/**
 * Store that maintains title width and height
 */
import Vue from "vue";
import { GetNode } from "./index";

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

        if (node.GetLevel() <= rootGetters["level/GetCurrentLevel"]) {
          return false;
        }

        const parent = node.parent;
        if (!parent) {
          return true;
        }

        const nodeWH = node.GetWH();

        return (
          (parent.GetLevel() <= rootGetters["level/GetCurrentLevel"] ||
            (parent.GetLevel() > rootGetters["level/GetCurrentLevel"] &&
              getters.GetIsVisible(parent.id))) &&
          nodeWH.width > titleWH.width + 20 &&
          nodeWH.height > titleWH.height + 10
        );
      };
    },
    GetTitleWH(state) {
      return nodeId => {
        return state.titles[nodeId];
      };
    }
  }
};
