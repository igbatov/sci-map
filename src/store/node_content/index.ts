import {clone} from "@/tools/utils";

export type RateValues = -1 | 0 | 1 | 2 | 3
export type ResourceRating = {
  resourceID: string;
  comment: string;
  rate: RateValues; // -1 прочитал и это плохо, 0 - не читал, но хочу прочитать, 1 сойдет, 2 понравилось, 3 я под очень сильным впечатлением
  hide: boolean;
};

export type NodeContent = {
  nodeID: string;
  wikipedia: string;
  comment: string;
  resourceRatings: Record<string, ResourceRating>;
};

export interface State {
  nodeContents: Record<string, NodeContent>;
}

export const mutations = {
  SET_CONTENTS: "SET_CONTENTS",
  SET_NODE_WIKIPEDIA: "SET_WIKIPEDIA",
  SET_NODE_COMMENT: "SET_COMMENT",
  ADD_TO_NODE_RESOURCE_RATINGS: "ADD_TO_NODE_RESOURCE_RATINGS",
  RATE_NODE_RESOURCE_RATING: "RATE_NODE_RESOURCE_RATING",
  HIDE_NODE_RESOURCE_RATING: "HIDE_NODE_RESOURCE_RATING",
  SET_NODE_RESOURCE_RATING_COMMENT: "SET_NODE_RESOURCE_COMMENT"
};

export const actions = {
  getNodeContent: "getNodeContent"
};

const EmptyNodeContent = {
  nodeID: "",
  wikipedia: "",
  comment: "",
  resources: {}
}

const EmptyResourceRating = {
  resourceID: "",
  comment: "",
  rate: 0, // -1 прочитал и это плохо, 0 - не читал, но хочу прочитать, 1 сойдет, 2 понравилось, 3 я под очень сильным впечатлением
  hide: false,
};

export const store = {
  namespaced: true,
  state: {
    nodeContents: {} as Record<string, NodeContent>
  } as State,
  actions: {
    [actions.getNodeContent](
      { state }: { state: State },
      nodeID: string
    ): NodeContent {
      return state.nodeContents[nodeID];
    }
  },
  mutations: {
    [mutations.SET_CONTENTS](
      state: State,
      nodeContents: Record<string, NodeContent>
    ) {
      state.nodeContents = nodeContents;
    },
    [mutations.SET_NODE_WIKIPEDIA](
      state: State,
      v: { nodeID: string; wikipedia: string }
    ) {
      if (!state.nodeContents[v.nodeID]) {
        state.nodeContents[v.nodeID] = clone(EmptyNodeContent)
        state.nodeContents[v.nodeID].nodeID = v.nodeID
      }
      state.nodeContents[v.nodeID].wikipedia = v.wikipedia;
    },
    [mutations.SET_NODE_COMMENT](
      state: State,
      v: { nodeID: string; comment: string }
    ) {
      if (!state.nodeContents[v.nodeID]) {
        state.nodeContents[v.nodeID] = clone(EmptyNodeContent)
        state.nodeContents[v.nodeID].nodeID = v.nodeID
      }
      state.nodeContents[v.nodeID].comment = v.comment;
    },
    [mutations.ADD_TO_NODE_RESOURCE_RATINGS](
      state: State,
      v: { rr: ResourceRating; nodeID: string }
    ) {
      if (!state.nodeContents[v.nodeID]) {
        if (!state.nodeContents[v.nodeID]) {
          state.nodeContents[v.nodeID] = clone(EmptyNodeContent)
          state.nodeContents[v.nodeID].nodeID = v.nodeID
        }
      }
      state.nodeContents[v.nodeID].resourceRatings[v.rr.resourceID] = v.rr;
    },
    [mutations.RATE_NODE_RESOURCE_RATING](
      state: State,
      v: { nodeID: string; resourceID: string; rating: RateValues }
    ) {
      if (!state.nodeContents[v.nodeID]) {
        state.nodeContents[v.nodeID] = clone(EmptyNodeContent)
        state.nodeContents[v.nodeID].nodeID = v.nodeID
      }
      if (!state.nodeContents[v.nodeID].resourceRatings[v.resourceID]) {
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID] = clone(EmptyResourceRating)
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID].resourceID = v.resourceID
      }
      state.nodeContents[v.nodeID].resourceRatings[v.resourceID].rate = v.rating;
    },
    [mutations.HIDE_NODE_RESOURCE_RATING](
      state: State,
      v: { nodeID: string; resourceID: string; hide: boolean }
    ) {
      if (!state.nodeContents[v.nodeID]) {
        state.nodeContents[v.nodeID] = clone(EmptyNodeContent)
        state.nodeContents[v.nodeID].nodeID = v.nodeID
      }
      if (!state.nodeContents[v.nodeID].resourceRatings[v.resourceID]) {
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID] = clone(EmptyResourceRating)
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID].resourceID = v.resourceID
      }
      state.nodeContents[v.nodeID].resourceRatings[v.resourceID].hide = v.hide;
    },
    [mutations.SET_NODE_RESOURCE_RATING_COMMENT](
      state: State,
      v: { nodeID: string; resourceID: string; comment: string }
    ) {
      if (!state.nodeContents[v.nodeID]) {
        state.nodeContents[v.nodeID] = clone(EmptyNodeContent)
        state.nodeContents[v.nodeID].nodeID = v.nodeID
      }
      if (!state.nodeContents[v.nodeID].resourceRatings[v.resourceID]) {
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID] = clone(EmptyResourceRating)
        state.nodeContents[v.nodeID].resourceRatings[v.resourceID].resourceID = v.resourceID
      }
      state.nodeContents[v.nodeID].resourceRatings[v.resourceID].comment = v.comment;
    }
  }
};
