export type ResourceRating = {
  resourceID: string;
  comment: string;
  rate: number; // -1 прочитал и это плохо, 0 - не читал, но хочу прочитать, 1 сойдет, 2 понравилось, 3 я под очень сильным впечатлением
  hide: boolean;
};

export type NodeContent = {
  nodeID: string;
  wikipedia: string;
  comment: string;
  resources: Record<string, ResourceRating>;
};

export interface State {
  nodeContents: Record<string, NodeContent>;
}

export const mutations = {
  SET_CONTENTS: "SET_CONTENTS",
  SET_NODE_WIKIPEDIA: "SET_WIKIPEDIA",
  SET_NODE_COMMENT: "SET_COMMENT",
  ADD_TO_NODE_RESOURCES: "ADD_TO_NODE_RESOURCES",
  RATE_NODE_RESOURCE: "RATE_NODE_RESOURCE",
  HIDE_NODE_RESOURCE: "HIDE_NODE_RESOURCE",
  SET_NODE_RESOURCE_COMMENT: "SET_NODE_RESOURCE_COMMENT"
};

export const actions = {
  getNodeContent: "getNodeContent"
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
      state.nodeContents[v.nodeID].wikipedia = v.wikipedia;
    },
    [mutations.SET_NODE_COMMENT](
      state: State,
      v: { nodeID: string; comment: string }
    ) {
      state.nodeContents[v.nodeID].comment = v.comment;
    },
    [mutations.ADD_TO_NODE_RESOURCES](
      state: State,
      v: { rr: ResourceRating; nodeID: string }
    ) {
      state.nodeContents[v.nodeID].resources[v.rr.resourceID] = v.rr;
    },
    [mutations.RATE_NODE_RESOURCE](
      state: State,
      v: { nodeID: string; resourceID: string; rating: number }
    ) {
      state.nodeContents[v.nodeID].resources[v.resourceID].rate = v.rating;
    },
    [mutations.HIDE_NODE_RESOURCE](
      state: State,
      v: { nodeID: string; resourceID: string; hide: boolean }
    ) {
      state.nodeContents[v.nodeID].resources[v.resourceID].hide = v.hide;
    },
    [mutations.SET_NODE_RESOURCE_COMMENT](
      state: State,
      v: { nodeID: string; resourceID: string; comment: string }
    ) {
      state.nodeContents[v.nodeID].resources[v.resourceID].comment = v.comment;
    }
  }
};
