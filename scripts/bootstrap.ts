import * as admin from "firebase-admin";
import {ServiceAccount} from "firebase-admin/lib/credential";
// import serviceAccount from "./private-key.json";
import serviceAccount from "./private-key-stg.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  // databaseURL: "https://sci-map-1982.firebaseio.com",
  // storageBucket: "sci-map-1982.appspot.com",
  databaseURL: "https://sci-map-stg-default-rtdb.firebaseio.com",
  storageBucket: "sci-map-stg.appspot.com",
});

const firestore =  admin.firestore()
const database =  admin.database()

export { admin, firestore, database };
