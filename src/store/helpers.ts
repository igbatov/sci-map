import firebase from "firebase";
import api from "@/api/api";
import { mutations as treeMutations } from "@/store/tree";
import { mutations as pinMutations } from "@/store/pin";
import { mutations as resourcesMutations } from "@/store/resources";
import { mutations as nodeContentMutations } from "@/store/node_content";
import { store } from "@/store/index";
import { printError } from "@/tools/utils";

export async function fetchMap(user: firebase.User | null) {
  const [tree, err] = await api.getMap(user);
  if (tree == null || err) {
    printError("fetchMap: cannot api.getMap(user)", { err });
  }

  //// Commented out because reading map from DB is always made from single general version
  // if (user && !tree) {
  //   [tree, err] = await api.getMap(null);
  //   if (tree == null || err) {
  //     printError("fetchMap: cannot api.getMap(null)", { err });
  //   }
  // }

  store.commit(`tree/${treeMutations.SET_TREE}`, tree);
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

export async function fetchResources() {
  let [resources, err] = await api.getResources();
  if (resources == null || err) {
    printError("fetchResources error", {err});
    return
  }

  store.commit(`resources/${resourcesMutations.SET_RESOURCES}`, resources);
}

export async function fetchNodeContents(user: firebase.User | null) {
  // fetch node_content from general map
  let [nodeContents, err] = await api.getNodeContents(null);
  if (nodeContents == null || err) {
    printError("fetchNodeContents error", {err});
    return
  }

  if (user) {
    const [userNodeContents, err] = await api.getNodeContents(user);
    if (userNodeContents == null || err) {
      printError("fetchNodeContents error", {err});
      return
    }

    // "merge" into general node content
    for (const id in userNodeContents) {
      nodeContents[id] = userNodeContents[id]
    }
  }

  store.commit(`nodeContent/${nodeContentMutations.SET_CONTENTS}`, nodeContents);
}
