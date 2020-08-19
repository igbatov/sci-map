/**
 * Store that maintains title width and height
 */
import Vue from "vue";
import { GetNode } from "./index";
import axios from "axios";
import htmlToText from "html-to-text";

export const FetchWiki = "FetchWiki";
export const ParseSections = "ParseSections";
export const SECTION_ME = "ME"; // Explanations
export const SECTION_CP = "CP"; // Community and projects
export const TYPE_TEXTBOOK = "TEXTBOOK";
export const TYPE_COURSE = "COURSE";
export const TYPE_SCIPOP = "SCIPOP";

export default {
  namespaced: true,
  state: {
    content: {},
    sections: {}
  },
  mutations: {
    SET_CONTENT(state, { nodeId, content }) {
      Vue.set(state.content, nodeId, content);
    },
    SET_SECTIONS(state, { nodeId, sections }) {
      Vue.set(state.sections, nodeId, sections);
    }
  },
  getters: {
    GetContent(state) {
      return nodeId => {
        return state.content[nodeId];
      };
    },
    GetSections(state) {
      return nodeId => {
        return state.sections[nodeId];
      };
    }
  },
  actions: {
    async [FetchWiki]({ commit, getters, rootGetters }, nodeId) {
      if (getters.GetContent(nodeId)) {
        return;
      }
      const node = rootGetters[GetNode](nodeId);
      if (!node.link) {
        return;
      }
      const wikiPage = node.link.substr(
        "https://en.wikipedia.org/wiki/".length
      );
      const data = await axios.get(
        "https://en.wikipedia.org/w/api.php?action=parse&page=" +
          wikiPage +
          "&prop=text&format=json&mobileformat=true&origin=*"
      );
      commit("SET_CONTENT", { nodeId, content: data.data.parse.text["*"] });

      // swagger https://en.wikipedia.org/api/rest_v1
      // const data = await axios.get('https://en.wikipedia.org/api/rest_v1/page/mobile-sections/'+wikiPage, {headers: {accept: "application/json", profile: "https://www.mediawiki.org/wiki/Specs/mobile-sections/0.14.1"}});
      // commit("SET_CONTENT", {nodeId, content: data.lead.sections[0].text})
    },
    [ParseSections]({ commit, getters, rootGetters }, nodeId) {
      if (getters.GetSections(nodeId)) {
        return;
      }
      const node = rootGetters[GetNode](nodeId);
      if (!node.note) {
        return;
      }

      const noteList = htmlToText
        .fromString(node.note, {
          wordwrap: false,
          preserveNewlines: true
        })
        .split("\n")
        .filter(str => !!str);
      const sections = {};
      noteList.forEach(note => {
        const rg = /\[([a-zA-Z0-9_\- ]+)\]\[([a-zA-Z0-9_\- ]+)\]\[([a-zA-Z0-9_\- ]+)\]([^[]+)\[([^\]]+)\]/g;
        const groups = rg.exec(note);
        if ([SECTION_ME, SECTION_CP].indexOf(groups[1]) !== -1) {
          if (!sections[groups[1]]) {
            sections[groups[1]] = [];
          }
          if ([TYPE_COURSE, TYPE_SCIPOP, TYPE_TEXTBOOK].indexOf(groups[2])) {
            sections[groups[1]].push({
              type: groups[2],
              votes: groups[3],
              name: groups[4],
              link: groups[5]
            });
          }
        }
      });
      commit("SET_SECTIONS", { nodeId, sections });
    }
  }
};
