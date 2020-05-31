/**
 * Store that maintains title width and height
 */
import Vue from "vue";
import { GetNode } from "./index";

const MaxVisibleLevel = 3;
const LastLevelAreaThreshold = 0.005;

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
        const wh = node.GetWH();
        if (wh) {
          const squarePercent =
            (wh.width * wh.height) / (window.innerHeight * window.innerWidth);
          if (
            node.GetLevel() ===
              rootGetters["level/GetCurrentLevel"] + MaxVisibleLevel + 1 &&
            squarePercent >= LastLevelAreaThreshold
          ) {
            return true;
          }
        }

        return !(
          node.GetLevel() <= rootGetters["level/GetCurrentLevel"] ||
          node.GetLevel() >
            rootGetters["level/GetCurrentLevel"] + MaxVisibleLevel
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
