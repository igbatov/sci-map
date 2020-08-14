/**
 * Store that maintains title width and height
 */
import Vue from "vue";
import { GetNode } from "./index";
import axios from "axios";

export const FetchWiki = "FetchWiki"

export default {
  namespaced: true,
  state: {
    content: {}
  },
  mutations: {
    SET_CONTENT(state, { nodeId, content }) {
      Vue.set(state.content, nodeId, content);
    }
  },
  getters: {
    GetContent(state) {
      return nodeId => {
        return state.content[nodeId]
      };
    },
  },
  actions: {
    async [FetchWiki]({commit, getters, rootGetters}, nodeId) {
      if (getters.GetContent(nodeId)) {
        return
      }
      const node = rootGetters[GetNode](nodeId);
      if (!node.wiki) {
        return
      }
      const wikiPage = node.wiki.substr("https://en.wikipedia.org/wiki/".length);
      const data = await axios.get('https://en.wikipedia.org/w/api.php?action=parse&page='+wikiPage+'&prop=text&format=json&mobileformat=true&origin=*')
      commit("SET_CONTENT", {nodeId, content: data.data.parse.text["*"]})
    }
  }
};
