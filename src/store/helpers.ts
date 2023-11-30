import firebase from "firebase";
import api from "@/api/api";
import { mutations as treeMutations } from "@/store/tree";
import { mutations as pinMutations } from "@/store/pin";
import { mutations as preconditionMutations } from "@/store/precondition";
import { mutations as resourcesMutations } from "@/store/resources";
import {
  mutations as nodeContentMutations,
  NodeContent
} from "@/store/node_content";
import { store, actions } from "@/store/index";
import { printError } from "@/tools/utils";
import { convertDBMapToTree } from "@/api/helpers";
import { DBNode } from "@/api/types";

/**
 * 1) fetch map
 * 2) subscribe to changes
 * 3) convert to tree and set to internal store
 * @param user
 */
export async function initMap(user: firebase.User | null) {
  const [map, err] = await api.getMap(user);
  if (map === null || err) {
    printError("fetchMap: cannot api.getMap(user)", { err });
  }
  // create Tree with denormalized positions
  const [tree, convErr] = convertDBMapToTree(map!);
  if (convErr !== null) {
    return [null, convErr];
  }
  store.commit(`tree/${treeMutations.SET_TREE}`, tree);

  // subscribe on changes for every node in map
  for (const id in map) {
    api.subscribeMapNodeChange(id, (dbNode: DBNode) => store.dispatch(actions.handleDBUpdate, dbNode))
  }
}

export async function fetchPins(user: firebase.User | null) {
  let [pins, err] = await api.getPins(user);
  if (pins == null || err) {
    console.error(err);
  }

  if (user && !pins) {
    [pins, err] = await api.getPins(null);
    if (pins == null || err) {
      console.error(err);
      pins = {};
    }
  }

  store.commit(`pin/${pinMutations.SET_PINS}`, pins);
}

export async function fetchPreconditions(user: firebase.User | null) {
  let [preconditions, err] = await api.getPreconditions(user);
  if (preconditions == null || err) {
    console.error(err);
    preconditions = {};
  }

  if (user && !preconditions) {
    [preconditions, err] = await api.getPreconditions(null);
    if (preconditions == null || err) {
      console.error(err);
      preconditions = {};
    }
  }

  store.commit(
    `precondition/${preconditionMutations.SET_PRECONDITIONS}`,
    preconditions
  );
}

export async function fetchResources() {
  const [resources, err] = await api.getResources();
  if (resources == null || err) {
    printError("fetchResources error", { err });
    return;
  }

  store.commit(`resources/${resourcesMutations.SET_RESOURCES}`, resources);
}

export async function fetchNodeContents(user: firebase.User | null) {
  // fetch node_content from general map
  const [nodeContent, err] = await api.getNodeContent();
  if (nodeContent == null || err) {
    printError("fetchNodeContents error", { err });
    return;
  }

  const nodeContents: Record<string, NodeContent> = {};
  for (const i in nodeContent) {
    nodeContents[i] = {
      nodeID: nodeContent[i].nodeID,
      content: nodeContent[i].content,
      resourceIds: nodeContent[i].resourceIds ? Object.keys(nodeContent[i].resourceIds) : []
    } as NodeContent;
  }

  store.commit(
    `nodeContent/${nodeContentMutations.SET_CONTENTS}`,
    nodeContents
  );

  if (user) {
    const [userComments, err] = await api.getUserComments(user);
    if (userComments == null || err) {
      printError("fetchNodeContents error", { err, user });
      return;
    }

    // fix in store
    store.commit(
      `nodeContent/${nodeContentMutations.SET_USER_COMMENTS}`,
      userComments
    );
  }
}

export async function initData(user: firebase.User | null) {
  await initMap(user);
  await fetchPins(user);
  await fetchPreconditions(user);
  await fetchResources();
  await fetchNodeContents(user);
}
