import { MapNode, Point, Tree } from "@/types/graphics";
import { InjectionKey } from "vue";
import { createStore, useStore as baseUseStore, Store } from "vuex";
import { treeToMapNodeLayers, morphChildrenPoints } from "@/tools/graphics";
import { findMapNode } from "@/store/tree/helpers";
import { cloneDeep } from "lodash";
import { ErrorKV } from "@/types/errorkv";

interface NodeRecordItem {
  node: Tree;
  parent: Tree | null;
}

export interface State {
  tree: Tree | null;
  nodeRecord: Record<number, NodeRecordItem>;
  mapNodeLayers: Array<Record<number, MapNode>>;
}

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  state: {
    tree: null,
    nodeRecord: {}, // id => NodeRecordItem
    mapNodeLayers: []
  },
  getters: {},
  mutations: {
    INIT(state: State, tree: Tree) {
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

    UPDATE_NODE_POSITION(state: State, v: { nodeId: number; position: Point }) {
      if (state.tree == null) {
        return;
      }

      const item = state.nodeRecord[v.nodeId];
      if (!item) {
        console.error(
          "updateNodePosition: cannot find node in nodeRecord",
          "v.nodeId",
          v.nodeId,
          "state.nodeRecord",
          state.nodeRecord
        );
        return;
      }
      if (!item.parent) {
        console.error(
          "updateNodePosition: cannot move root of tree",
          "v.nodeId",
          v.nodeId
        );
        return;
      }

      item.node.position = v.position;

      // Если мы меняем один узел, то могут поменяться границы всех соседей
      // так что надо действовать так как будто поменялись границы всех подузлов родителя узла

      let inProcess = [...item.parent.children];
      let newLayers: Array<Record<number, MapNode>> | null = null;
      let err: ErrorKV = null;
      while (inProcess.length) {
        // save old borders of nodes
        const oldMapNodes: Record<number, MapNode> = {};
        for (const node of inProcess) {
          const [oldMapNode] = cloneDeep(
            findMapNode(node.id, state.mapNodeLayers)
          );
          if (oldMapNode == null) {
            console.error(
              "Cannot find oldMapNode",
              "nodeId",
              v.nodeId,
              "layers",
              state.mapNodeLayers
            );
            return;
          }
          oldMapNodes[oldMapNode.id] = oldMapNode;
        }

        // recalculate new borders for nodes in inProcess
        [newLayers, err] = treeToMapNodeLayers(state.tree);
        if (newLayers == null || err != null) {
          console.error(
            "updateNodePosition: cannot treeToMapNodeLayers",
            "err",
            err,
            "state.tree",
            state.tree
          );
          return;
        }

        // calculate children positions for nodes in inProcess
        const newInProcess = [];
        for (const node of inProcess) {
          const [newMapNode] = findMapNode(node.id, newLayers);
          if (newMapNode == null) {
            console.error(
              "Cannot find newMapNode",
              "nodeId",
              v.nodeId,
              "layers",
              state.mapNodeLayers
            );
            return;
          }

          if (state.nodeRecord[node.id].node.children.length == 0) {
            continue;
          }

          const [newChildrenPositions, err] = morphChildrenPoints(
            oldMapNodes[newMapNode.id].border,
            newMapNode.border,
            state.nodeRecord[newMapNode.id].node.children.reduce(
              (prev, curr) => {
                prev[curr.id] = curr.position;
                return prev;
              },
              {} as Record<number, Point>
            )
          );
          if (err != null) {
            console.error(
              "updateNodePosition: cannot morphChildrenPoints",
              "err",
              err,
              "oldMapNodes[newMapNode.id].border",
              oldMapNodes[newMapNode.id].border,
              "newMapNode.border",
              newMapNode.border,
              "children positions",
              state.nodeRecord[newMapNode.id].node.children.map(
                ch => ch.position
              )
            );
            return;
          }

          for (const id in newChildrenPositions) {
            state.nodeRecord[Number(id)].node.position =
              newChildrenPositions[Number(id)];
            newInProcess.push(state.nodeRecord[Number(id)].node);
          }
        }
        inProcess = newInProcess;
      }

      if (newLayers == null) {
        console.error("updateNodePosition: newLayers is null");
        return;
      }
      state.mapNodeLayers = newLayers;
    }
  }
});

// define your own `useStore` composition function
export function useStore() {
  return baseUseStore(key);
}
