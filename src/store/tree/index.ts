import { MapNode, Point, Tree } from "@/types/graphics";
import { treeToMapNodeLayers } from "@/tools/graphics";
import {
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
  getters: {},
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
      const stack: NodeRecordItem[] = [{ node: tree, parent: null }];
      while (stack.length) {
        const item = stack.pop();
        if (!item) {
          break;
        }
        state.nodeRecord[item.node.id] = item;
        stack.push(
          ...item.node.children.map(child => ({
            node: child,
            parent: item.node
          }))
        );
      }

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
      updatePosition(state, v);
    }
  }
};
