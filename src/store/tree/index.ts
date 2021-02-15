import { MapNode, Point, Tree } from "@/types/graphics";
import {
  isInside,
  treeToMapNodeLayers,
  treeToNodeRecord
} from "@/tools/graphics";
import {
  findMapNode,
  getNewNodeCenter,
  updatePosition
} from "@/store/tree/helpers";

export interface NodeRecordItem {
  node: Tree;
  parent: Tree | null;
}

export interface State {
  tree: Tree | null;
  nodeRecord: Record<number, NodeRecordItem>;
  mapNodeLayers: Array<Record<number, MapNode>>;
  selectedNodeId: number | null;
}

export const mutations = {
  SET_SELECTED_NODE_ID: "SET_SELECTED_NODE_ID",
  SET_TREE: "SET_TREE",
  UPDATE_NODE_POSITION: "UPDATE_NODE_POSITION",
  ADD_NODE: "ADD_NODE"
};

export const store = {
  namespaced: true,
  state: {
    tree: null,
    nodeRecord: {}, // id => NodeRecordItem
    mapNodeLayers: [],
    selectedNodeId: null
  },
  getters: {
    selectedNode: (state: State) => {
      if (!state.selectedNodeId) {
        return null;
      }
      return state.nodeRecord[state.selectedNodeId].node;
    }
  },
  mutations: {
    /**
     * ADD_NODE
     * @param state
     * @param v
     */
    [mutations.ADD_NODE](
      state: State,
      v: { parentId: number | null; title: string }
    ) {
      if (state.tree === null) {
        return;
      }
      if (v.parentId === null) {
        v.parentId = state.tree.id; // take root node as parent
      }
      const parentRecord = state.nodeRecord[v.parentId];
      if (!parentRecord) {
        console.error(
          "ADD_NODE: cannot find parentRecord",
          "parentId",
          v.parentId
        );
        return;
      }

      const [newCenter, nodeToModify, err] = getNewNodeCenter(
        parentRecord.node,
        state.mapNodeLayers
      );
      if (err != null) {
        console.error("ADD_NODE: cannot getNewNodeCenter", err);
        return;
      }

      const newNode = {
        id: Math.max(...Object.keys(state.nodeRecord).map(k => Number(k))) + 1,
        title: v.title,
        position: newCenter!,
        wikipedia: "",
        resources: [],
        children: []
      };
      parentRecord.node.children.push(newNode);
      state.nodeRecord[newNode.id] = {
        parent: parentRecord.node,
        node: newNode
      };
      // update state.mapNodeLayers
      const [ls, err2] = treeToMapNodeLayers(state.tree);
      if (ls == null || err2 != null) {
        console.error(err2);
        return;
      }
      state.mapNodeLayers = ls;
      if (nodeToModify != null) {
        updatePosition(state, {
          nodeId: nodeToModify.id,
          position: nodeToModify.position
        });
      }
    },

    /**
     * SET_SELECTED_NODE_ID
     * @param state
     * @param id
     */
    [mutations.SET_SELECTED_NODE_ID](state: State, id: number | null) {
      state.selectedNodeId = id;
    },

    /**
     * SET_TREE
     * @param state
     * @param tree
     */
    [mutations.SET_TREE](state: State, tree: Tree | null) {
      if (tree == null) {
        state.tree = null;
        state.nodeRecord = {};
        state.mapNodeLayers = [];
        return;
      }
      state.tree = tree;

      // traverse tree and fill in nodeRecord
      state.nodeRecord = treeToNodeRecord(tree);

      // fill state.mapNodeLayers
      const [ls, err] = treeToMapNodeLayers(tree);
      if (ls == null || err != null) {
        console.error(err);
        return;
      }
      state.mapNodeLayers = ls;
    },

    /**
     * UPDATE_NODE_POSITION
     * @param state
     * @param v
     */
    [mutations.UPDATE_NODE_POSITION](
      state: State,
      v: { nodeId: number; position: Point }
    ) {
      // check that new position is inside parent borders
      const parent = state.nodeRecord[v.nodeId].parent;
      if (parent !== null) {
        const [parentMapNode, layerId] = findMapNode(
          parent.id,
          state.mapNodeLayers
        );
        if (!parentMapNode) {
          console.error(
            "UPDATE_NODE_POSITION: cannot find parent mapNode",
            "parent.id",
            parent.id,
            "state.mapNodeLayers",
            state.mapNodeLayers
          );
          return;
        }
        if (!isInside(v.position, parentMapNode.border)) {
          return;
        }
      }
      updatePosition(state, v);
    }
  }
};
