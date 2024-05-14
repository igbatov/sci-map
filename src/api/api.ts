import firebase from "firebase/compat";
import { Tree } from "@/types/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "../tools/errorkv";
import axios from "axios";
import { Pins } from "@/store/pin";
import {mutations as preconditionMutations, Preconditions} from "@/store/precondition";
import {mutations as imageMutations} from "@/store/image";
import { DBMapNode, DBImage} from "@/api/types";
import { convertChildren } from "./helpers";
import { NodeComment, NodeContent } from "@/store/node_content";
import emulatorConfig from "../../firebase.json";
import prodConfig from "./prodConfig.json";
import stgConfig from "./stgConfig.json";
import { debounce } from "lodash";

import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import {store} from "@/store";

const MAP_FROM_STORAGE = false; // use storage as a source for the map (or database)

const update = async (data: Record<string, any>): Promise<ErrorKV> => {
  try {
    await firebase
      .database()
      .ref()
      .update(data);
    return null;
  } catch (e) {
    return NewErrorKV("api: error in update", { err: e });
  }
};

const debouncedUpdate = debounce(update, 2000);

// These ROOT_WIDTH and ROOT_HEIGHT is used only to scale to a device window proportionally,
// An actual proportion and border of map is hardcoded in store/tree ROOT_WIDTH/ROOT_HEIGHT/ROOT_BORDER
export default {
  ROOT_WIDTH: window.innerWidth > window.innerHeight ? window.innerWidth : 1.5*0.95*window.innerWidth,
  ROOT_HEIGHT: window.innerWidth > window.innerHeight ? 0.95*window.innerHeight : 1.5*window.innerHeight,
  ROOT_CENTER_X: window.innerWidth > window.innerHeight ? 0.3 * window.innerWidth + (0.7 * window.innerWidth) / 2 : window.innerWidth/2,
  ROOT_CENTER_Y: window.innerWidth > window.innerHeight ? window.innerHeight / 2 : (0.75 * window.innerHeight) / 2,
  ST_WIDTH: 1000,
  ST_HEIGHT: 1000,
  initFirebase() {
    // Initialize Firebase
    if (process.env.VUE_APP_PROJECT === "prod") {
      firebase.initializeApp(prodConfig);
    } else if (process.env.VUE_APP_PROJECT === "stage") {
      firebase.initializeApp(stgConfig);
    }

    firebase.analytics();

    if (process.env.VUE_APP_PROJECT === "emulator") {
      console.log("Starting in emulator mode");
      firebase
        .auth()
        .useEmulator(`http://localhost:${emulatorConfig.emulators.auth.port}`);
      firebase
        .database()
        .useEmulator("localhost", emulatorConfig.emulators.database.port);
      firebase
        .storage()
        .useEmulator("localhost", emulatorConfig.emulators.storage.port);
      connectFirestoreEmulator(
        getFirestore(),
        "localhost",
        emulatorConfig.emulators.firestore.port
      );
    }
  },

  async getMapFromDB(): Promise<[Record<string, DBMapNode> | null, ErrorKV]> {
    const snapshot = await firebase
      .database()
      .ref("map")
      .get();
    if (!snapshot.exists()) {
      return [null, NewErrorKV("!snapshot.exists", {})];
    }
    const map = snapshot.val();

    return [map, null];
  },

  /**
   * TODO: use it to cut costs on DB reads from read-only users
   * @param user
   */
  async getMapFromStorage(
    user: firebase.User | null
  ): Promise<[Tree | null, ErrorKV]> {
    const storage = firebase.storage().ref();
    let ref = storage.child(`/map.json`);
    if (user) {
      ref = storage.child(`/user/${user.uid}/map.json`);
    }
    const url = await ref.getDownloadURL();

    const response = await axios.get(url);
    return [
      {
        id: "0",
        title: "",
        position: { x: this.ROOT_WIDTH / 2, y: this.ROOT_HEIGHT / 2 },
        // children: apiTree.children
        children: response.data
      },
      null
    ];
  },

  async getMap(
    user: firebase.User | null
  ): Promise<[Record<string, DBMapNode> | null, ErrorKV]> {
    try {
      return await this.getMapFromDB();
    } catch (e) {
      return [null, NewErrorKV(e.message, { e: e })];
    }
  },

  async getPins(user: firebase.User | null): Promise<[Pins | null, ErrorKV]> {
    try {
      if (user == null) {
        // for anonymous use general pins
        const storage = firebase.storage().ref();
        const ref = storage.child(`/pins.json`);
        const url = await ref.getDownloadURL();

        const response = await axios.get(url);
        return [response.data, null];
      } else {
        // for authenticated user use realtime database
        const snapshot = await firebase
          .database()
          .ref(`user_data/${user.uid}/pins`)
          .get();
        if (!snapshot.exists()) {
          return [null, NewErrorKV("!snapshot.exists", {})];
        }
        return [snapshot.val(), null];
      }

    } catch (e) {
      return [null, NewErrorKV(e.message, { e: e })];
    }
  },

  async savePins(user: firebase.User, pins: Pins) {
    if (!user) {
      return;
    }
    await firebase
      .database()
      .ref(`user_data/${user.uid}/pins`).set(pins);
  },

  /**
   * getSubscriptions
   * @param user
   */
  async getSubscriptions(user: firebase.User | null): Promise<[Pins | null, ErrorKV]> {
    if (!user) {
      return [null, null]
    }
    try {
      // for authenticated user use realtime database
      const snapshot = await firebase
        .database()
        .ref(`user_subscription/${user.uid}`)
        .get();
      if (!snapshot.exists()) {
        return [null, NewErrorKV("!snapshot.exists", {})];
      }
      return [snapshot.val(), null];
    } catch (e) {
      return [null, NewErrorKV(e.message, { e: e })];
    }
  },

  /**
   * setSubscription
   * @param user
   * @param v
   */
  async setSubscription(user: firebase.User | null, v:{nodeID: string, mode: number | null}) {
    if (!user) {
      return;
    }
    await firebase
      .database()
      .ref(`user_subscription/${user.uid}/${v.nodeID}`).set(v.mode);
  },

  async getPreconditions(
    user: firebase.User | null
  ): Promise<[Preconditions | null, ErrorKV]> {
    try {
      const snapshot = await firebase
        .database()
        .ref("precondition")
        .get();
      if (!snapshot.exists()) {
        return [null, NewErrorKV("!snapshot.exists", {})];
      }
      const preconditions = snapshot.val();

      return [preconditions, null];
    } catch (e) {
      return [null, NewErrorKV(e.message, { e: e })];
    }
  },

  async savePreconditions(
    user: firebase.User | null,
    preconditions: { nodeId: string; preconditionIds: string[] }
  ) {
    if (!user) {
      return;
    }
    await firebase
      .database()
      .ref("precondition/" + preconditions.nodeId)
      .set(preconditions.preconditionIds);
  },

  subscribeMapNodeChange(nodeID: string, cb: (a: DBMapNode) => any) {
    this.subscribeDBChange(
      `map/${nodeID}`,
      (snap: firebase.database.DataSnapshot) => {
        if (!snap.exists()) {
          return;
        }
        const node = snap.val() as DBMapNode;
        // console.log('got update for map node', node)
        node.id = node.id.toString();
        node.children = convertChildren(node.children);
        cb(node);
      }
    );
  },

  subscribeNodeContentChange(
    nodeID: string,
    cb: (a: { nodeID: string; content: string }) => any
  ) {
    this.subscribeDBChange(
      `node_content/${nodeID}`,
      (snap: firebase.database.DataSnapshot) => {
        if (!snap.exists()) {
          return;
        }
        const node = snap.val() as { nodeID: string; content: string };
        // console.log('got update for node content', node)
        cb(node);
      }
    );
  },

  subscribePreconditionNodeChange(
    nodeID: string,
  ) {
    this.subscribeDBChange(
      `precondition/${nodeID}`,
      (snap: firebase.database.DataSnapshot) => {
        if (!snap.exists()) {
          return;
        }
        const preconditionIDs = snap.val() as Array<string>;
        store.commit(
          `precondition/${preconditionMutations.UPDATE_PRECONDITIONS}`,
          { nodeID: nodeID, preconditionIDs: preconditionIDs }
        );
      }
    );
  },

  subscribeNodeImageChange(
    nodeID: string,
  ) {
    this.subscribeDBChange(
      `node_image/${nodeID}`,
      (snap: firebase.database.DataSnapshot) => {
        if (!snap.exists()) {
          return;
        }
        const images = snap.val() as Record<string, DBImage>;
        store.commit(
          `image/${imageMutations.UPDATE_IMAGES}`,
          {nodeID, images}
        );
      }
    );
  },

  subscribeDBChange(
    path: string,
    cb: (a: firebase.database.DataSnapshot) => any
  ) {
    firebase
      .database()
      .ref(path)
      .on("value", cb);
  },

  unsubscribeDBChange(
    path: string,
    cb?: (a: firebase.database.DataSnapshot) => any
  ) {
    firebase
      .database()
      .ref(path)
      .off("value", cb);
  },

  async transaction(nodeID: string, update: (val: any) => any) {
    await firebase
      .database()
      .ref("map/" + nodeID)
      .transaction(
        update,
        () => {
          return;
        },
        false
      );
  },

  async setPublicUserData(
    userID: string,
    displayName: string | null,
    discordName: string | null
  ) {
    try {
      await firebase
        .database()
        .ref("public_user_data/" + userID)
        .set({
          displayName,
          discordName
        });
    } catch (e) {
      console.error(e);
    }
  },

  async getMapNode(nodeID: string): Promise<DBMapNode | null> {
    const pr = await firebase
      .database()
      .ref("map/" + nodeID)
      .get();
    const node = pr.val();
    if (!node) {
      console.error("got null fetching from map/nodeID", nodeID)
      return null
    }
    node.id = node.id.toString();
    node.children = convertChildren(node.children);
    return node;
  },

  async getTrashNode(nodeID: string, type: string): Promise<DBMapNode | null> {
    const pr = await firebase
      .database()
      .ref(`trash/${nodeID}/${type}`)
      .get();
    return pr.val();
  },

  generateKey(): string | null {
    return firebase
      .database()
      .ref()
      .push().key;
  },

  async findKeyInList(path: string, value: string): Promise<string | null> {
    const snap = await firebase
      .database()
      .ref(path)
      .orderByValue()
      .equalTo(value)
      .limitToFirst(1)
      .get();
    return snap.key;
  },

  async findKeyOfChild(
    nodeID: string,
    childID: string
  ): Promise<string | null> {
    const pr = await firebase
      .database()
      .ref("map/" + nodeID)
      .get();
    const node = pr.val();
    if (!node.children) {
      return null;
    }

    for (const key in node.children) {
      if (node.children[key].toString() === childID) {
        return key;
      }
    }
    return null;
  },

  update,
  debouncedUpdate,

  /**
   * getUserSubscribePeriod
   * @param user
   */
  async getUserSubscribePeriod(
    user: firebase.User | null
  ): Promise<string> {
    if (!user) {
      return ''
    }
    const userID = user.uid;
    const snapshot = await firebase
      .database()
      .ref(`user_data/${userID}/subscribe_period`)
      .get();
    if (!snapshot.exists()) {
      return '';
    }
    return snapshot.val();
  },

  /**
   * setUserSubscribePeriod
   * @param user
   * @param period
   */
  async setUserSubscribePeriod(
    user: firebase.User,
    period: string,
  ){
    const userID = user.uid;
    return await firebase
      .database()
      .ref(`user_data/${userID}/subscribe_period`)
      .set(period);
  },

  /**
   * setUserSearchPhrase
   * @param userID
   * @param searchPhrase
   */
  async setUserLastSearch(
    userID: string,
    searchPhrase: string,
  ){
    return await firebase
      .database()
      .ref(`user_data/${userID}/last_search`)
      .set(searchPhrase);
  },

  async getUserComments(
    user: firebase.User
  ): Promise<[Record<string, NodeComment> | null, ErrorKV]> {
    const userID = user.uid;
    const snapshot = await firebase
      .database()
      .ref(`user_data/${userID}/comment`)
      .get();
    if (!snapshot.exists()) {
      return [null, NewErrorKV("!snapshot.exists", {})];
    }
    const nodeComment = snapshot.val();

    return [nodeComment, null];
  },

  async getNodeContent(): Promise<
    [Record<string, NodeContent> | null, ErrorKV]
  > {
    const snapshot = await firebase
      .database()
      .ref(`node_content`)
      .get();

    if (!snapshot.exists()) {
      return [{}, null];
    }

    return [snapshot.val(), null];
  }
};
