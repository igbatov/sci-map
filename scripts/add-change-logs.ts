/**
 * Add logs for nodes im map that has not corresponding "create" logs in /changes
 * (for example, because realtime db was imported from another place)
 * CREATE BACKUP OF FIRESTORE BEFORE RUNNING THIS SCRIPT!!!
 * (See Firestore backup section in README.md)
 *
 * In a typical situation (when logging is working) new node has a separate log for every attribute.
 * For /map: map_id, name, parentID, position, children
 * For /content: content
 * For /precondition: precondition
 */

import { firestore, database } from "./bootstrap";

// get all nodes that exist in /map but do not have a corresponding log in firestore /changes
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
