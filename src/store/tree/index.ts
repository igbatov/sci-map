import { MapNode, Point, Tree } from "@/types/graphics";
import {
  isInside,
  treeToMapNodeLayers,
  treeToNodeRecord
} from "@/tools/graphics";
import {
  addNode,
  calcSubtreesPositions,
  findMapNode,
  updatePosition
} from "@/store/tree/helpers";
import { v4 as uuidv4 } from "uuid";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";

export interface NodeRecordItem {
  node: Tree;
  parent: Tree | null;
}

export interface State {
  tree: Tree | null;
  nodeRecord: Record<string, NodeRecordItem>;
  mapNodeLayers: Array<Record<string, MapNode>>;
  selectedNodeId: string | null;
}

export const mutations = {
  SET_SELECTED_NODE_ID: "SET_SELECTED_NODE_ID",
  SET_TREE: "SET_TREE",
  UPDATE_NODE_POSITION: "UPDATE_NODE_POSITION",
  CREATE_NEW_NODE: "CREATE_NEW_NODE",
  CUT_PASTE_NODE: "CUT_PASTE_NODE",
  REMOVE_NODE: "REMOVE_NODE"
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
      if (!state.nodeRecord[state.selectedNodeId]) {
        return null;
      }
      return state.nodeRecord[state.selectedNodeId].node;
    }
  },
  mutations: {
    /**
     * REMOVE_NODE
     * @param state
     * @param v
     */
    [mutations.REMOVE_NODE](
      state: State,
      v: { nodeID: string; returnError: ErrorKV }
    ) {
      if (state.tree === null) {
        v.returnError = NewErrorKV("state.tree === null", {});
        return;
      }

      if (!state.nodeRecord[v.nodeID]) {
        v.returnError = NewErrorKV(
          "REMOVE_NODE: cannot find nodeId in nodeRecord",
          { nodeID: v.nodeID, nodeRecord: state.nodeRecord }
        );
        return;
      }
      const parent = state.nodeRecord[v.nodeID].parent;
      if (!parent) {
        v.returnError = NewErrorKV("REMOVE_NODE: cannot remove root node", {
          nodeId: v.nodeID
        });
        return;
      }

      // recursively remove node and its descendants from nodeRecord
      const stack = [v.nodeID];
      while (stack.length) {
        const id = stack.pop();
        stack.push(...state.nodeRecord[id!].node.children.map(node => node.id));
        delete state.nodeRecord[id!];
      }

      // remove from parents children
      const ind = parent.children.findIndex(node => node.id === v.nodeID);
      parent.children.splice(ind, 1);

      // update layers
      const [ls, err2] = treeToMapNodeLayers(state.tree);
      if (ls == null || err2 != null) {
        v.returnError = err2;
        return;
      }

      state.mapNodeLayers = ls;
    },

    [mutations.CUT_PASTE_NODE](
      state: State,
      v: { parentID: string; nodeID: string; returnError: ErrorKV }
    ) {
      if (state.tree === null) {
        v.returnError = NewErrorKV("state.tree === null", {});
        return;
      }

      const newParentRecord = state.nodeRecord[v.parentID];
      if (!newParentRecord) {
        v.returnError = NewErrorKV(
          "CUT_PASTE_NODE: cannot find newParentRecord",
          {
            parentID: v.parentID
          }
        );
        return;
      }

      const nodeRecord = state.nodeRecord[v.nodeID];
      if (!nodeRecord) {
        v.returnError = NewErrorKV("CUT_PASTE_NODE: cannot find nodeRecord", {
          "node.id": v.nodeID
        });
        return;
      }

      const oldParent = nodeRecord.parent;

      // remove from tree
      const ind = oldParent!.children.findIndex(node => node.id === v.nodeID);
      oldParent!.children.splice(ind, 1);

      const [mapNode] = findMapNode(v.nodeID, state.mapNodeLayers);
      v.returnError = addNode(state, {
        parentID: v.parentID,
        node: nodeRecord.node,
        mapNode: mapNode!
      });
      if (v.returnError) {
        return;
      }

      // update mapNodes in old parent
      v.returnError = calcSubtreesPositions(state, oldParent!.id);
      if (v.returnError) {
        return;
      }

      // update layers
      const [ls, err2] = treeToMapNodeLayers(state.tree);
      if (ls == null || err2 != null) {
        v.returnError = err2;
        return;
      }
      state.mapNodeLayers = ls;
    },

    /**
     * Add new node
     * @param state
     * @param v
     */
    [mutations.CREATE_NEW_NODE](
      state: State,
      v: {
        parentID: string | null;
        title: string;
        return: { error: ErrorKV; nodeID: string };
      }
    ) {
      if (state.tree === null) {
        v.return.error = NewErrorKV("state.tree === null", {});
        return;
      }
      if (v.parentID === null) {
        v.parentID = state.tree.id; // take root node as parent
      }

      // create new node
      const newNode = {
        id: uuidv4(),
        title: v.title,
        position: { x: 0, y: 0 },
        wikipedia: "",
        resources: [],
        children: []
      };

      // create new MapNode
      const mapNode = {
        id: newNode.id,
        title: v.title,
        center: { x: 0, y: 0 },
        border: [
          { x: 0, y: 0 },
          { x: 0, y: 100 },
          { x: 100, y: 100 },
          { x: 100, y: 0 }
        ] // this will be updated later in treeToMapNodeLayers
      };

      v.return.error = addNode(state, {
        parentID: v.parentID,
        node: newNode,
        mapNode
      });
      v.return.nodeID = newNode.id;
    },

    /**
     * SET_SELECTED_NODE_ID
     * @param state
     * @param id
     */
    [mutations.SET_SELECTED_NODE_ID](state: State, id: string | null) {
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
      v: {
        nodeId: string;
        newCenter: Point;
        returnError: ErrorKV; // still waiting for vuex to implement mutation return values https://github.com/vuejs/vuex/issues/1437
      }
    ) {
      // check that new position is inside parent borders
      const parent = state.nodeRecord[v.nodeId].parent;
      if (parent !== null) {
        const [parentMapNode] = findMapNode(parent.id, state.mapNodeLayers);
        if (!parentMapNode) {
          v.returnError = NewErrorKV(
            "UPDATE_NODE_POSITION: cannot find parent mapNode",
            {
              "parent.id": parent.id,
              "state.mapNodeLayers": state.mapNodeLayers
            }
          );
          return;
        }

        if (!isInside(v.newCenter, parentMapNode.border)) {
          v.returnError = NewErrorKV("!isInside", {
            newCenter: v.newCenter,
            "parentMapNode.border": parentMapNode.border
          });
          return;
        }
      }

      v.returnError = updatePosition(state, {
        nodeId: v.nodeId,
        position: v.newCenter
      });
    }
  }
};
