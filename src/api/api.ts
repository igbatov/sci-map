import firebase from "firebase";
import {Tree, Polygon, Point} from "@/types/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
// import { apiTree } from "./mocks";
import apiTree from "./mindmeister";
import axios from "axios";
import { Pins } from "@/store/pin";
import {DBNode} from "@/api/types";
import {getVoronoiCellRecords, getVoronoiCells, morphChildrenPoints} from "@/tools/graphics";
import {convertDBMapToTree} from "@/api/helpers";

const IS_OFFLINE = false; // to write code even without wi-fi set this to true
const MAP_FROM_STORAGE = false; // is storage is source for map (or database)

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
    if (!IS_OFFLINE) {
      firebase.initializeApp(firebaseConfig);
      firebase.analytics();
    }
  },

  async getMapFromDB(): Promise<[Tree | null, ErrorKV]> {
    const snapshot = await firebase.database().ref("map").get();
    if (!snapshot.exists()) {
      return [null, NewErrorKV("!snapshot.exists", {})]
    }
    const map = snapshot.val()

    // create Tree with denormalized positions
    const [tree, err] = convertDBMapToTree(map, this.ROOT_WIDTH, this.ROOT_HEIGHT, this.ST_WIDTH, this.ST_HEIGHT)
    if (err !== null) {
      return [null, err]
    }

    return [tree, null]
  },

  async getNode(user: firebase.User | null, nodeID: string): Promise<[DBNode | null, ErrorKV]> {
    const pr = await firebase.database().ref("map/"+nodeID).get()
    return pr.val()
  },

  async getMapFromStorage(user: firebase.User | null): Promise<[Tree | null, ErrorKV]> {
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
        wikipedia: "",
        resources: [],
        // children: apiTree.children
        children: response.data
      },
      null
    ];
  },

  async getMap(user: firebase.User | null): Promise<[Tree | null, ErrorKV]> {
    if (IS_OFFLINE) {
      return [
        {
          id: "0",
          title: "",
          position: { x: this.ROOT_WIDTH / 2, y: this.ROOT_HEIGHT / 2 },
          wikipedia: "",
          resources: [],
          children: apiTree.children
        },
        null
      ];
    }

    try {
      if (MAP_FROM_STORAGE) {
        return this.getMapFromStorage(user)
      } else {
        return this.getMapFromDB()
      }
    } catch (e) {
      return [null, NewErrorKV(e.message, { e: e })];
    }
  },

  async getPins(user: firebase.User | null): Promise<[Pins | null, ErrorKV]> {
    if (IS_OFFLINE) {
      return [{}, null];
    }

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
    if (IS_OFFLINE) {
      return new Promise(resolve => {
        resolve(null);
      });
    }

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
    if (IS_OFFLINE) {
      return;
    }

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
    if (IS_OFFLINE) {
      return;
    }

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

  subscribeDBChange(path: string, cb: (a: firebase.database.DataSnapshot) => any) {
    firebase.database().ref(path).on('value', cb);
  },

  unsubscribeDBChange(path: string, cb?: (a: firebase.database.DataSnapshot) => any) {
    firebase.database().ref(path).off('value', cb);
  },

  async transaction(nodeID: string, update: (val: any) => any) {
    await firebase.database().ref("map/"+nodeID).transaction(update, ()=>{ return }, false);
  }
};
