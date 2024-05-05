/**
 * Remove all logs in firestore after FROM_TIMESTAMP (in milliseconds)
 * CREATE BACKUP OF FIRESTORE BEFORE RUNNING THIS SCRIPT!!!
 */

import * as admin from "firebase-admin";
import {ServiceAccount} from "firebase-admin/lib/credential";
import serviceAccount from "./private-key.json";
const firebase_tools = require("firebase-tools");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: "https://sci-map-1982.firebaseio.com",
  storageBucket: "sci-map-1982.appspot.com",
});

const FROM_TIMESTAMP=99999999999999; // 99999999999999 (in milliseconds) is a 5138 year
const firestore = admin.firestore()

firestore
  .collection('changes')
  .where('timestamp', '>', FROM_TIMESTAMP)
  .get()
  .then(async (snapshot) => {
    console.log(snapshot.docs.length)
    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
      console.log(doc.ref.path)
      console.log(doc.data())
      batch.delete(doc.ref);
    });
    await batch.commit();

    /**
     * We are not using subcollections in 'changes' now,
     * But in case we were, to recursively remove subcollections, we can use firebase_tools
     */
    // snapshot.docs.forEach((doc) => {
    //   firebase_tools.firestore.delete((doc.ref.path), {
    //       recursive: true,
    //       force: true,
    //   })
    // });
  });
