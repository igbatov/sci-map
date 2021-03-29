import {MapNode, Point, Tree} from "@/types/graphics";
import {
  addVector,
  isInside,
  treeToMapNodeLayers,
  treeToNodeRecord
} from "@/tools/graphics";
import {
  addNode,
  calcSubtreesPositions,
  findMapNode,
  getNewNodeCenter,
  updatePosition
} from "@/store/tree/helpers";
import {printError} from "@/tools/utils";

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
  ADD_NEW_NODE: "ADD_NEW_NODE",
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
     * @param nodeId
     */
    [mutations.REMOVE_NODE](state: State, nodeId: number) {
      if (state.tree === null) {
        return;
      }

      if (!state.nodeRecord[nodeId]) {
        console.error(
          "REMOVE_NODE: cannot find nodeId in nodeRecord",
          nodeId,
          state.nodeRecord
        );
        return;
      }
      const parent = state.nodeRecord[nodeId].parent;
      if (!parent) {
        console.error("REMOVE_NODE: cannot remove root node", nodeId);
        return;
      }

      // recursively remove node and its descendants from nodeRecord
      const stack = [nodeId];
      while (stack.length) {
        const id = stack.pop();
        stack.push(...state.nodeRecord[id!].node.children.map(node => node.id));
        delete state.nodeRecord[id!];
      }

      // remove from parents children
      const ind = parent.children.findIndex(node => node.id === nodeId);
      parent.children.splice(ind, 1);

      // update layers
      const [ls, err2] = treeToMapNodeLayers(state.tree);
      if (ls == null || err2 != null) {
        console.error(err2);
        return;
      }
      state.mapNodeLayers = ls;
    },

    [mutations.CUT_PASTE_NODE](
      state: State,
      v: {parentID: number, nodeID: number}
    ) {
      if (state.tree === null) {
        return;
      }

      const newParentRecord = state.nodeRecord[v.parentID];
      if (!newParentRecord) {
        printError("CUT_PASTE_NODE: cannot find newParentRecord", {"parentID":v.parentID});
        return;
      }

      const nodeRecord =  state.nodeRecord[v.nodeID]
      if (!nodeRecord) {
        printError("CUT_PASTE_NODE: cannot find nodeRecord", {"node.id":v.nodeID});
        return;
      }

      const oldParent = nodeRecord.parent;

      // remove from tree
      const ind = oldParent!.children.findIndex(node => node.id === v.nodeID);
      oldParent!.children.splice(ind, 1);

      const [mapNode] = findMapNode(v.nodeID, state.mapNodeLayers)
      addNode(state, {parentID: v.parentID, node: nodeRecord.node, mapNode: mapNode!})

      // update mapNodes in old parent
      calcSubtreesPositions(state, oldParent!.id)

      // update layers
      const [ls, err2] = treeToMapNodeLayers(state.tree);
      if (ls == null || err2 != null) {
        console.error(err2);
        return;
      }
      state.mapNodeLayers = ls;
    },

    /**
     * Add new node
     * @param state
     * @param v
     */
    [mutations.ADD_NEW_NODE](
      state: State,
      v: { parentID: number | null; title: string }
    ) {
      if (state.tree === null) {
        return;
      }
      if (v.parentID === null) {
        v.parentID = state.tree.id; // take root node as parent
      }

      // create new node
      const newNode = {
        id: Math.max(...Object.keys(state.nodeRecord).map(k => Number(k))) + 1,
        title: v.title,
        position: {x:0, y:0},
        wikipedia: "",
        resources: [],
        children: []
      };

      // create new MapNode
      const mapNode = {
        id: newNode.id,
        title: v.title,
        center: {x:0, y:0},
        border: [{x:0, y:0}, {x:0, y:100}, {x:100, y:100}, {x:100, y:0}] // this will be updated later in treeToMapNodeLayers
      }

      addNode(state, {parentID:v.parentID, node:newNode, mapNode})
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
      v: { nodeId: number; delta: Point }
    ) {
      const [mapNode] = findMapNode(v.nodeId, state.mapNodeLayers);
      if (!mapNode) {
        console.error(
          "UPDATE_NODE_POSITION: cannot find mapNode",
          "v.nodeId",
          v.nodeId,
          "state.mapNodeLayers",
          state.mapNodeLayers
        );
        return;
      }

      const newCenter = addVector(
        { from: { x: 0, y: 0 }, to: mapNode.center },
        { from: { x: 0, y: 0 }, to: v.delta }
      ).to;

      // check that new position is inside parent borders
      const parent = state.nodeRecord[v.nodeId].parent;
      if (parent !== null) {
        const [parentMapNode] = findMapNode(parent.id, state.mapNodeLayers);
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

        if (!isInside(newCenter, parentMapNode.border)) {
          return;
        }
      }

      updatePosition(state, { nodeId: v.nodeId, position: newCenter });
    }
  }
};
