import { clone } from "@/tools/utils";
import { Commit } from "vuex";
import api from "@/api/api";
import { ErrorKV } from "@/types/errorkv";
import { State as UserState } from "@/store/user";

export type NodeContent = {
  nodeID: string;
  content: string;
};

// user private comment
export type NodeComment = {
  nodeID: string;
  comment: string;
};

export interface State {
  nodeContents: Record<string, NodeContent>;
  userNodeComments: Record<string, NodeComment>;
}

export const mutations = {
  SET_CONTENTS: "SET_CONTENTS",
  SET_USER_COMMENTS: "SET_USER_COMMENTS",
  SET_NODE_CONTENT: "SET_NODE_CONTENT",
  SET_NODE_COMMENT: "SET_NODE_COMMENT"
};

export const actions = {
  getNodeContent: "getNodeContent",
  setNodeContent: "setNodeContent",
  setNodeComment: "setNodeComment"
};

export const EmptyNodeContent = {
  nodeID: "",
  content: ""
} as NodeContent;

function createContentIfNotExist(
  nodeContents: Record<string, NodeContent>,
  nodeID: string
) {
  if (!nodeContents[nodeID]) {
    nodeContents[nodeID] = clone(EmptyNodeContent);
    nodeContents[nodeID].nodeID = nodeID;
  }
}

export const EmptyNodeComment = {
  nodeID: "",
  comment: ""
} as NodeComment;

function createCommentIfNotExist(
  userNodeComments: Record<string, NodeComment>,
  nodeID: string
) {
  if (!userNodeComments[nodeID]) {
    userNodeComments[nodeID] = clone(EmptyNodeComment);
    userNodeComments[nodeID].nodeID = nodeID;
  }
}

export const store = {
  namespaced: true,
  state: {
    nodeContents: {} as Record<string, NodeContent>,
    userNodeComments: {} as Record<string, NodeComment>
  } as State,
  actions: {
    [actions.getNodeContent](
      { state }: { state: State },
      nodeID: string
    ): NodeContent {
      return state.nodeContents[nodeID];
    },

    /**
     * setNodeComment
     * @param commit
     * @param state
     * @param v
     */
    async [actions.setNodeComment](
      { commit, rootState }: { commit: Commit; rootState: { user: UserState } },
      v: { nodeID: string; comment: string }
    ): Promise<ErrorKV> {
      // cannot save for unauthorized user
      if (!rootState.user.user || rootState.user.user.isAnonymous) {
        return null;
      }

      // add to DB
      const err = await api.debouncedUpdate({
        [`user_data/${rootState.user.user.uid}/comment/${v.nodeID}/nodeID`]: v.nodeID,
        [`user_data/${rootState.user.user.uid}/comment/${v.nodeID}/comment`]: v.comment
      });
      if (err) {
        return err;
      }

      // change in local store
      commit(`${mutations.SET_NODE_COMMENT}`, v);

      return null;
    },

    /**
     * setNodeContent
     * @param commit
     * @param state
     * @param v
     */
    async [actions.setNodeContent](
      { commit, state }: { commit: Commit; state: State },
      v: { nodeID: string; content: string }
    ): Promise<ErrorKV> {
      // change in local store before adding to DB for comfortable textbox editing experience
      commit(`${mutations.SET_NODE_CONTENT}`, v);

      // add to DB
      const err = await api.debouncedUpdate({
        [`node_content/${v.nodeID}/nodeID`]: v.nodeID,
        [`node_content/${v.nodeID}/content`]: v.content
      });
      if (err) {
        return err;
      }

      return null;
    }
  },
  mutations: {
    /**
     * SET_CONTENTS
     * @param state
     * @param nodeContents
     */
    [mutations.SET_CONTENTS](
      state: State,
      nodeContents: Record<string, NodeContent>
    ) {
      state.nodeContents = nodeContents;
    },

    /**
     * SET_USER_CONTENTS
     * @param state
     * @param userNodeComments
     */
    [mutations.SET_USER_COMMENTS](
      state: State,
      userNodeComments: Record<string, NodeComment>
    ) {
      state.userNodeComments = userNodeComments;
    },

    /**
     * SET_NODE_CONTENT
     * @param state
     * @param v
     */
    [mutations.SET_NODE_CONTENT](
      state: State,
      v: { nodeID: string; content: string }
    ) {
      createContentIfNotExist(state.nodeContents, v.nodeID);
      state.nodeContents[v.nodeID].content = v.content;
    },

    /**
     * SET_NODE_COMMENT
     * @param state
     * @param v
     */
    [mutations.SET_NODE_COMMENT](
      state: State,
      v: { nodeID: string; comment: string }
    ) {
      createCommentIfNotExist(state.userNodeComments, v.nodeID);
      state.userNodeComments[v.nodeID].comment = v.comment;
    }
  }
};
