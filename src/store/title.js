/**
 * Store that maintains title width and height
 */
import Vue from "vue";

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
        const nodeWH = rootGetters.GetNode(nodeId).GetWH();
        return (
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
