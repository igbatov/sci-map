import firebase from "firebase";
import axios from "axios";
import { Tree } from "@/types/graphics";
import { ErrorKV } from "@/types/errorkv";
import NewErrorKV from "@/tools/errorkv";

export default {
  init() {
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

  async getMap(): Promise<[Tree | null, ErrorKV]> {
    const storage = firebase.storage().ref();
    const mapRef = storage.child(`/map.json`);
    const url = await mapRef.getDownloadURL();
    try {
      const response = await axios.get(url);
      return [
        {
          id: 0,
          title: "",
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          wikipedia: "",
          resources: [],
          children: response.data
        },
        null
      ];
    } catch (e) {
      return [null, NewErrorKV(e.response, [{ code: e.code }])];
    }
  },

  async getCurrentUser(): Promise<firebase.User> {
    return new Promise(resolve =>
      firebase.auth().onAuthStateChanged(user => {
        if (user && !user.isAnonymous) {
          resolve(user);
        }
      })
    );
  },

  async saveMap(map: string) {
    const user = await this.getCurrentUser();
    if (user) {
      const storage = firebase.storage().ref();
      const mapRef = storage.child(`/user/${user.uid}/map.json`);
      const snapshot = await mapRef.putString(btoa(map), "base64");
      console.log(snapshot);
    }
  },

  async signIn() {
    await firebase
      .auth()
      .signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
};
