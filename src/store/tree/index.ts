import { MapNode, Point, Tree } from "@/types/graphics";
import {
  convertPosition,
  isInside,
  treeToMapNodeLayers,
  treeToNodeRecord
} from "@/tools/graphics";
import { findMapNode, updatePosition } from "@/store/tree/helpers";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
import { DBMapNode } from "@/api/types";
import { printError, round } from "@/tools/utils";
import api from "@/api/api";
import { Commit, Dispatch } from "vuex";
import {subscribeNodeChanges, unSubscribeNodeChanges} from "@/store/helpers";

// Define root border for 2560x1600
const ROOT_WIDTH = 2560;
const ROOT_HEIGHT = 1600;
const cf = 1 / 3;
const ROOT_BORDER = [
  { x: 0, y: cf * ROOT_HEIGHT },
  { x: 0, y: 2 * cf * ROOT_HEIGHT },
  { x: (cf / 2.5) * ROOT_WIDTH, y: (1 - cf / 4) * ROOT_HEIGHT },
  { x: cf * ROOT_WIDTH, y: ROOT_HEIGHT },
  { x: 2 * cf * ROOT_WIDTH, y: ROOT_HEIGHT },
  { x: (1 - cf / 2.5) * ROOT_WIDTH, y: (1 - cf / 4) * ROOT_HEIGHT },
  { x: ROOT_WIDTH, y: 2 * cf * ROOT_HEIGHT },
  { x: ROOT_WIDTH, y: cf * ROOT_HEIGHT },
  { x: (1 - cf / 2.5) * ROOT_WIDTH, y: (cf / 4) * ROOT_HEIGHT },
  { x: 2 * cf * ROOT_WIDTH, y: 0 },
  { x: cf * ROOT_WIDTH, y: 0 },
  { x: (cf / 2.5) * ROOT_WIDTH, y: (cf / 4) * ROOT_HEIGHT }
];
const ROOT_CENTER = { x: api.ROOT_CENTER_X, y: api.ROOT_CENTER_Y };

// Scale root border proportionally to fit 2/3 of user browser viewport and move the left
const userFitCoefficient = Math.min(
  api.ROOT_WIDTH / ROOT_WIDTH,
  api.ROOT_HEIGHT / ROOT_HEIGHT
);
for (const idx in ROOT_BORDER) {
  ROOT_BORDER[idx].x =
    userFitCoefficient * ROOT_BORDER[idx].x +
    api.ROOT_CENTER_X -
    (userFitCoefficient * ROOT_WIDTH) / 2;
  ROOT_BORDER[idx].y =
    userFitCoefficient * ROOT_BORDER[idx].y +
    api.ROOT_CENTER_Y -
    (userFitCoefficient * ROOT_HEIGHT) / 2;
}

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
  REMOVE_NODE: "REMOVE_NODE"
};

export const actions = {
  handleMapNodeUpdate: "handleMapNodeUpdate"
};

export const store = {
  namespaced: true,
  state() {
    return {
      tree: null,
      nodeRecord: {} as Record<string, NodeRecordItem>, // id => NodeRecordItem
      mapNodeLayers: [] as Array<Record<string, DBMapNode>>,
      selectedNodeId: null
    };
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

  actions: {
    /**
     * Update tree and dependant structures on DBNode change
     *
     * После добавления нового узла мы не вносим изменения локально, а сохраняем в базу и ждем пока оттуда придет обновление
     *
     * Маппинг изменений в виде снэпшотов на изменения в формате store/history выглядит следующим образом.
     * Мы сравниваем наш узел и пришедший новый снэпшот этого узла
     *
     * Если видим удаление child, то это либо перенос, либо удаление узла.
     * В любом случае мы можем у себя удалить этот узел (мы не удаляем всю информацию, только из дерева - 'fake removal').
     * Если это перенос, то мы либо получили событие добавления в другой узел
     * до этого события, либо получим его после. Если получили до, то из этого узла уже должны были его удалить,
     * так что остается вариант когда мы еще получим событие о добавлении. В этом случаем для нас это будет добавление нового узла.
     * То есть мы запросим из базы этот узел и вставим его
     *
     * Если видим добавление child, то это либо перенос, либо добавление нового узла. Если мы не находим у себя child с таким id,
     * то это добавление - нам нужно запросить из базы node с таким id и добавить его к себе.
     * Если в nodeRecord есть такой узел, то это перенос - мы удаляем его из старого родителя и вставляем в новый
     *
     * Этими двумя кейсами покрываются события добавления, удаления и переноса.
     * Событие изменения имени и позиции мапятся тривиально
     *
     * @param commit
     * @param state
     * @param dispatch
     * @param dbNode
     */
    async [actions.handleMapNodeUpdate](
      {
        commit,
        state,
      }: { commit: Commit; state: State; dispatch: Dispatch },
      dbNode: DBMapNode
    ) {
      const dbNodeRecord = state.nodeRecord[dbNode.id];
      if (!dbNodeRecord) {
        // if it is a new node, we will fetch it from its parent children update event
        return;
      }

      const oldDBNode = {
        id: dbNodeRecord.node.id,
        parentID: dbNodeRecord.parent ? dbNodeRecord.parent.id : null,
        name: dbNodeRecord.node.title,
        children: dbNodeRecord.node.children.map(n => n.id).sort(),
        position: dbNodeRecord.node.position
      };

      const newChildren = dbNode.children.filter(
        x => !oldDBNode.children.includes(x)
      );
      const removedChildren = oldDBNode.children.filter(
        x => !dbNode.children.includes(x)
      );

      // Add/move of new child
      if (newChildren.length) {
        for (const childID of newChildren) {
          if (state.nodeRecord[childID]) {
            console.log(
              "actions.handleDBUpdate: remove node for cut-and-paste",
              state.nodeRecord[childID]
            );
            // if we already have this node, then it is cut-and-paste new parent
            // so we should remove node from old parent
            const v = {
              nodeID: childID,
              returnError: null
            };
            commit(mutations.REMOVE_NODE, {
              nodeID: childID,
              returnError: null
            });
            if (v.returnError) {
              printError("handleDBUpdate: cannot cut node", {
                err: v.returnError
              });
            }
          }

          // request node and its children from the server, fill in tree
          const addedDBNode = await api.getMapNode(childID);
          console.log(
            "actions.handleDBUpdate: add node for cut-and-paste",
            addedDBNode
          );

          const toProcess = [addedDBNode];
          if (!addedDBNode) {
            // we cannot find node for addition, remove it from parent
            dbNode.children = dbNode.children.filter(id => id != childID);
            printError("Cannot find node for addition", { nodeID: childID });
            continue;
          }
          while (toProcess.length) {
            const inProcessNode = toProcess.pop();
            if (!inProcessNode) {
              continue;
            }
            // create new MapNode
            const treeNode = {
              id: inProcessNode.id,
              title: inProcessNode.name,
              position: inProcessNode.position,
              children: []
            } as Tree;
            if (!state.nodeRecord[inProcessNode.parentID]) {
              printError("Cannot find nodeID in nodeRecord", {
                nodeID: inProcessNode.parentID
              });
              return;
            }
            // make sure we have no duplicates
            state.nodeRecord[
              inProcessNode.parentID
            ].node.children = state.nodeRecord[
              inProcessNode.parentID
            ].node.children.filter(n => n.id != treeNode.id);
            // add child to parent
            state.nodeRecord[inProcessNode.parentID].node.children.push(
              treeNode
            );
            // add child to nodeRecord
            state.nodeRecord[treeNode.id] = {
              parent: state.nodeRecord[inProcessNode.parentID].node,
              node: treeNode
            };
            // subscribe to new node changes
            subscribeNodeChanges(treeNode.id);
            for (const childID of inProcessNode.children) {
              const childNode = await api.getMapNode(childID);
              if (!childNode) {
                // we cannot find node for addition, remove it from parent
                inProcessNode.children = inProcessNode.children.filter(
                  id => id != childID
                );
                printError("Cannot find node for addition", {
                  nodeID: childID
                });
                continue;
              }
              toProcess.push(childNode);
            }
          }
        }
      }

      // Remove of child
      if (removedChildren.length) {
        for (const childID of removedChildren) {
          if (!state.nodeRecord[childID] || !state.nodeRecord[childID].parent) {
            // node was already removed somewhere
            continue;
          }
          if (
            state.nodeRecord[childID] &&
            state.nodeRecord[childID].parent!.id !== dbNode.id
          ) {
            // node was already removed from this parent (this is cut-and-paste operation)
            continue;
          }
          console.log(
            "actions.handleDBUpdate: removing children",
            state.nodeRecord[childID]
          );
          const v = { nodeID: childID, returnError: null };
          commit(mutations.REMOVE_NODE, v);
          if (v.returnError) {
            printError("actions.handleDBUpdate: cannot remove node", {
              err: v.returnError,
              id: childID
            });
          }
          // unsubscribe from removed node changes
          unSubscribeNodeChanges(childID);
        }
      }

      if (removedChildren.length || newChildren.length) {
        const [ls, err2] = treeToMapNodeLayers(
          state.tree!,
          ROOT_BORDER,
          ROOT_CENTER
        );
        if (err2) {
          printError("Cannot treeToMapNodeLayers", { err: err2 });
          return;
        }
        state.mapNodeLayers = ls!;
      }

      // Change of position
      if (
        round(dbNode.position.x) !== round(oldDBNode.position.x) ||
        round(dbNode.position.y) !== round(oldDBNode.position.y)
      ) {
        // calculate denormalized position of dbNode
        const [denormalizedPosition] = convertPosition(
          "denormalize",
          dbNode.position,
          dbNodeRecord.parent ? dbNodeRecord.parent.id : null,
          state.mapNodeLayers
        );
        if (oldDBNode.parentID == dbNode.parentID) {
          // we do not want to process position change due to parent change - it is already processed by ADD_NODE
          const v = {
            nodeId: dbNode.id,
            newCenter: denormalizedPosition,
            returnError: null
          };
          commit(mutations.UPDATE_NODE_POSITION, v);
          if (v.returnError !== null) {
            printError(
              "actions.handleDBUpdate: cannot update node's position",
              { dbNode: dbNode, err: v.returnError }
            );
            return;
          }
        }
      }

      // Change of name
      if (oldDBNode.name !== dbNode.name) {
        dbNodeRecord.node.title = dbNode.name;
        const [node] = findMapNode(oldDBNode.id, state.mapNodeLayers);
        if (!node) {
          return;
        }
        node.title = dbNode.name;
      }
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

      // remove node and its descendants from nodeRecord
      const stack = [v.nodeID];
      while (stack.length) {
        const id = stack.pop();
        if (!id) {
          continue;
        }
        stack.push(...state.nodeRecord[id].node.children.map(node => node.id));
        delete state.nodeRecord[id];
      }

      // remove from parent's children
      const ind = parent.children.findIndex(node => node.id === v.nodeID);
      parent.children.splice(ind, 1);
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
      const [ls, err] = treeToMapNodeLayers(tree, ROOT_BORDER, ROOT_CENTER);
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
