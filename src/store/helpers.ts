import firebase from "firebase/compat";
import api from "@/api/api";
import {
  mutations as treeMutations,
  actions as treeActions
} from "@/store/tree";
import { mutations as pinMutations } from "@/store/pin";
import { mutations as subscriptionsMutations } from "@/store/subscriptions";
import { mutations as preconditionMutations } from "@/store/precondition";
import {
  mutations as nodeContentMutations,
  NodeContent
} from "@/store/node_content";
import { store } from "@/store/index";
import { printError } from "@/tools/utils";
import { convertDBMapToTree } from "@/api/helpers";
import { DBMapNode } from "@/api/types";
import { add as textSearchAdd } from "@/tools/textsearch";
import {mutations as userMutations} from "@/store/user";

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
  // General advice is to listen to specific paths (not root) and dynamically change subscribe/unsubscribe
  // https://firebase.google.com/docs/database/usage/optimize#efficient-listeners
  for (const id in map) {
    subscribeNodeChanges(id)
  }
}

export function unSubscribeNodeChanges(id: string) {
  api.unsubscribeDBChange(`map/${id}`)
  api.unsubscribeDBChange(`node_content/${id}`)
  api.unsubscribeDBChange(`precondition/${id}`)
  api.unsubscribeDBChange(`node_image/${id}`)
}

export function subscribeNodeChanges(id: string) {
  // subscribe children, name or position change
  api.subscribeMapNodeChange(id, (dbNode: DBMapNode) =>
    store.dispatch(`tree/${treeActions.handleMapNodeUpdate}`, dbNode)
  );

  // subscribe node content change
  api.subscribeNodeContentChange(
    id,
    (v: { nodeID: string; content: string }) => {
      textSearchAdd(v.nodeID, v.content);
      store.commit(`nodeContent/${nodeContentMutations.SET_NODE_CONTENT}`, v);
    }
  );

  // subscribe on precondition changes for every node
  api.subscribePreconditionNodeChange(id);

  // subscribe image change
  api.subscribeNodeImageChange(id)
}

export async function fetchPins(user: firebase.User | null) {
  let [pins, err] = await api.getPins(user);
  if (pins == null) {
    if (err) {
      console.error("fetchPins", err);
    } else {
      console.log("fetchPins: empty pins");
    }
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

export async function fetchSubscribePeriod(user: firebase.User | null) {
  if (!user) {
    return
  }
  const period = await api.getUserSubscribePeriod(user);
  store.commit(`user/${userMutations.SET_SUBSCRIBE_PERIOD}`, period);
}

export async function fetchSubscriptions(user: firebase.User | null) {
  const [subscriptions, err] = await api.getSubscriptions(user);
  if (subscriptions == null) {
    if (err) {
      console.error("fetchPins", err);
    } else {
      console.log("fetchPins: empty pins");
    }
  }

  store.commit(`subscriptions/${subscriptionsMutations.SET_SUBSCRIPTIONS}`, subscriptions);
}

export async function initPreconditions(user: firebase.User | null) {
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

/**
 * Fetch all node content and subscribe for content change for each node
 * @param user
 */
export async function initNodeContents(user: firebase.User | null) {
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
      content: nodeContent[i].content
    } as NodeContent;
  }

  store.commit(
    `nodeContent/${nodeContentMutations.SET_CONTENTS}`,
    nodeContents
  );

  if (user) {
    const [userComments, err] = await api.getUserComments(user);
    if (err) {
      printError("fetch userComments error", { err, user });
      return;
    }
    if (userComments === null) {
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
  await fetchSubscribePeriod(user);
  await fetchSubscriptions(user);
  await initPreconditions(user);
  await initNodeContents(user);
}
