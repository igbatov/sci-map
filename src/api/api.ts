import firebase from "firebase";
import { Tree } from "@/types/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "../tools/errorkv";
import { apiTree } from "./mocks";
// import apiTree from "./mindmeister";
import axios from "axios";
import { Pins } from "@/store/pin";
import { DBNode } from "@/api/types";
import { convertChildren, convertDBMapToTree } from "./helpers";
import { Resource } from "@/store/resources";
import { NodeContent, NodeContentAggregate } from "@/store/node_content";
import emulatorConfig from "../../firebase.json";

const MAP_FROM_STORAGE = false; // is storage is source for map (or database)
let FUNCTION_DOMAIN = "https://us-central1-sci-map-1982.cloudfunctions.net/";
export const FUNCTION_CHANGE_RATING = "changeRating";

export default {
  ROOT_WIDTH: 1440,
  ROOT_HEIGHT: 821,
  ST_WIDTH: 1000,
  ST_HEIGHT: 1000,
  initFirebase() {
    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: "AIzaSyCP50k-WOkTeG8BYvRtu4Bo_x3T2RnVsxU",
      authDomain: "sci-map-1982.firebaseapp.com",
      databaseURL: "https://sci-map-1982.firebaseio.com",
      projectId: "sci-map-1982",
      storageBucket: "sci-map-1982.appspot.com",
      messagingSenderId: "340899060236",
      appId: "1:340899060236:web:b136e9289e342a8bb62c29",
      measurementId: "G-TV74Q61H9P"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();

    if (process.env.VUE_APP_IS_EMULATOR) {
      console.log("Starting in emulator mode");
      firebase
        .auth()
        .useEmulator(`http://localhost:${emulatorConfig.emulators.auth.port}`);
      firebase
        .database()
        .useEmulator("localhost", emulatorConfig.emulators.database.port);
      FUNCTION_DOMAIN = "http://localhost:5001/sci-map-1982/us-central1/";
    }
  },

  async callFunction(
    method: string,
    params: Record<string, string>
  ): Promise<[string, ErrorKV]> {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      return [
        "",
        NewErrorKV("callFunction: cannot determine current user", {})
      ];
    }
    const idToken = await currentUser.getIdToken(true);
    params.idToken = idToken;
    try {
      const response = await axios.get(FUNCTION_DOMAIN + method, { params });
      return [response.data, null];
    } catch (e) {
      return ["", NewErrorKV("Error in callFunction", { method, params, e })];
    }
  },

  async getMapFromDB(): Promise<[Tree | null, ErrorKV]> {
    const snapshot = await firebase
      .database()
      .ref("map")
      .get();
    if (!snapshot.exists()) {
      return [null, NewErrorKV("!snapshot.exists", {})];
    }
    const map = snapshot.val();

    // create Tree with denormalized positions
    const [tree, err] = convertDBMapToTree(map);
    if (err !== null) {
      return [null, err];
    }

    return [tree, null];
  },

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

  async getMap(user: firebase.User | null): Promise<[Tree | null, ErrorKV]> {
    try {
      if (MAP_FROM_STORAGE) {
        return this.getMapFromStorage(user);
      } else {
        return this.getMapFromDB();
      }
    } catch (e) {
      return [null, NewErrorKV(e.message, { e: e })];
    }
  },

  async getPins(user: firebase.User | null): Promise<[Pins | null, ErrorKV]> {
    try {
      const storage = firebase.storage().ref();
      let ref = storage.child(`/pins.json`);
      if (user) {
        ref = storage.child(`/user/${user.uid}/pins.json`);
      }
      const url = await ref.getDownloadURL();

      const response = await axios.get(url);
      return [response.data, null];
    } catch (e) {
      return [null, NewErrorKV(e.message, { e: e })];
    }
  },

  async getCurrentUser(): Promise<firebase.User | null> {
    return new Promise(resolve =>
      firebase.auth().onAuthStateChanged(user => {
        if (user && !user.isAnonymous) {
          resolve(user);
        } else {
          resolve(null);
        }
      })
    );
  },

  async saveUserMap(user: firebase.User, map: Tree) {
    if (!user) {
      return;
    }

    const storage = firebase.storage().ref();
    const ref = storage.child(`/user/${user.uid}/map.json`);
    await ref.putString(
      btoa(unescape(encodeURIComponent(JSON.stringify(map.children)))),
      "base64"
    );
  },

  async savePins(user: firebase.User, pins: Pins) {
    if (!user) {
      return;
    }

    const storage = firebase.storage().ref();
    const ref = storage.child(`/user/${user.uid}/pins.json`);
    await ref.putString(
      btoa(unescape(encodeURIComponent(JSON.stringify(pins)))),
      "base64"
    );
  },

  subscribeNodeChange(nodeID: string, cb: (a: DBNode) => any) {
    this.subscribeDBChange(
      `map/${nodeID}`,
      (snap: firebase.database.DataSnapshot) => {
        if (!snap.exists()) {
          return;
        }
        const node = snap.val() as DBNode;
        node.children = convertChildren(node.children);
        cb(node);
      }
    );
  },

  unsubscribeNodeChange(nodeID: string) {
    firebase
      .database()
      .ref(`map/${nodeID}`)
      .off("value");
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

  async setNode(node: DBNode) {
    await firebase
      .database()
      .ref("map/" + node.id)
      .set(node);
  },

  async getNode(nodeID: string): Promise<DBNode | null> {
    const pr = await firebase
      .database()
      .ref("map/" + nodeID)
      .get();
    const node = pr.val();
    node.children = convertChildren(node.children);
    return node;
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
      if (node.children[key] === childID) {
        return key;
      }
    }
    return null;
  },

  async update(data: Record<string, any>): Promise<ErrorKV> {
    try {
      await firebase
        .database()
        .ref()
        .update(data);
      return null;
    } catch (e) {
      return NewErrorKV("api: error in update", { err: e });
    }
  },

  async getResources(): Promise<[Record<string, Resource> | null, ErrorKV]> {
    const snapshot = await firebase
      .database()
      .ref("resources")
      .get();
    if (!snapshot.exists()) {
      return [null, NewErrorKV("!snapshot.exists", {})];
    }
    const resources = snapshot.val();

    return [resources, null];
  },

  async getNodeContents(
    user: firebase.User
  ): Promise<[Record<string, NodeContent> | null, ErrorKV]> {
    const userID = user.uid;
    const snapshot = await firebase
      .database()
      .ref(`node_content/${userID}`)
      .get();
    if (!snapshot.exists()) {
      return [null, NewErrorKV("!snapshot.exists", {})];
    }
    const nodeContents = snapshot.val();

    return [nodeContents, null];
  },

  async getNodeContentAggregate(): Promise<
    [Record<string, NodeContentAggregate> | null, ErrorKV]
  > {
    const snapshot = await firebase
      .database()
      .ref(`node_content_aggregate`)
      .get();

    if (!snapshot.exists()) {
      return [{}, null];
    }

    return [snapshot.val(), null];
  }
};
