import firebase from "firebase";
import api from "@/api/api";
import { mutations as treeMutations } from "@/store/tree";
import { mutations as pinMutations } from "@/store/pin";
import { store } from "@/store/index";

export async function fetchMap(user: firebase.User | null) {
  let [tree, err] = await api.getMap(user);
  if (tree == null || err) {
    console.error(err);
  }

  if (user && !tree) {
    [tree, err] = await api.getMap(null);
    if (tree == null || err) {
      console.error(err);
    }
  }

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
