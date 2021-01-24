import firebase from "firebase";
import { Tree } from "@/types/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";
// import { apiTree } from "./mocks";
import axios from "axios";

export default {
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
  },

  async getMap(user: firebase.User | null): Promise<[Tree | null, ErrorKV]> {
    try {
      const storage = firebase.storage().ref();
      let mapRef = storage.child(`/map.json`);
      if (user) {
        mapRef = storage.child(`/user/${user.uid}/map.json`);
      }
      const url = await mapRef.getDownloadURL();

      const response = await axios.get(url);
      return [
        {
          id: 0,
          title: "",
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          wikipedia: "",
          resources: [],
          // children: apiTree
          children: response.data
        },
        null
      ];
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

  async saveMap(user: firebase.User, map: Tree) {
    if (!user) {
      return;
    }

    const storage = firebase.storage().ref();
    const mapRef = storage.child(`/user/${user.uid}/map.json`);
    await mapRef.putString(btoa(JSON.stringify(map.children)), "base64");
  }
};
