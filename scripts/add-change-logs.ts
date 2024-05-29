/**
 * Add logs for nodes in /map, /node_content, /precondition that has no corresponding "create" logs in /changes
 * (for example,
 * because realtime db was imported from another place
 * or change_*.js triggers were not working for some time)
 *
 * CREATE BACKUP OF FIRESTORE BEFORE RUNNING THIS SCRIPT!!!
 * (See Firestore backup section in README.md)
 *
 * In a typical situation (when functions/change_*.js triggers are working)
 * every new node has a separate log for every attribute.
 * For /map: map_id, name, parentID, position, children
 * For /node_content: content_id, content
 * For /precondition: precondition
 */

import { firestore, database } from "./bootstrap";
import * as rtdbTypes from "@firebase/database-types";
import * as _firestore from '@google-cloud/firestore';
const {ActionType} = require("../functions/actions.js");

const FUNCTION_LOG_NAME = "add-change-logs";
// user_id that will be used as author of generated records in /changes
const USER_ID = "xB6B7c4Srca4FwgIBbBWx0S74vE3";
const ACTION_TIMESTAMP = 1702105605868;

/**
 * Add changes for /map nodes without record in /changes
 * @param database
 * @param firestore
 */
const addMapChanges = async function (database: rtdbTypes.Database, firestore: _firestore.Firestore) {
  const snapshot = await database.ref('map').get();
  if (!snapshot.exists()) {
    console.error(FUNCTION_LOG_NAME + " error: map snapshot do not exist")
    return;
  }

  const allCount = Object.keys(snapshot.val()).length;
  let count = 0;
  for (const id in snapshot.val()) {
    count++;
    console.log(count, "of", allCount, "(", Math.round(100*count/allCount), "%)")
    if (id === '0') {
      // we do not want log root node
      continue;
    }
    // check for the corresponding log for every record in /map
    for (const action of [ActionType.MapID, ActionType.Name, ActionType.ParentID, ActionType.Position, ActionType.Children]) {
      console.log("searching for", id, action);
      const logSnapshot = await firestore
        .collection('changes')
        .where('node_id', '==', id)
        .where('action', '==', action)
        .limit(1)
        .get();

      if (!logSnapshot.docs || logSnapshot.docs.length == 0) {
        let attributes = {};
        // add log for this action
        if (action == ActionType.MapID) {
          attributes = {valueAfter: id, valueBefore: null}
        } else if (action == ActionType.Name) {
          attributes = {value: snapshot.val()[id].name}
        } else if (action == ActionType.ParentID) {
          attributes = {valueAfter: snapshot.val()[id].parentID, valueBefore: null}
        } else if (action == ActionType.Position) {
          attributes = snapshot.val()[id].position
        } else if (action == ActionType.Children) {
          if (!snapshot.val()[id].children || Object.keys(snapshot.val()[id].children).length === 0) {
            continue;
          }
          const valueAfter = {} as Record<string, string>;
          for (const key in snapshot.val()[id].children) {
            valueAfter[key] = snapshot.val()[id].children[key];
          }
          attributes = {
            removed: [],
            added: Object.values(snapshot.val()[id].children),
            valueBefore: null,
            valueAfter: valueAfter,
          }
        } else {
          continue;
        }
        console.log(id, action, attributes);
        await firestore
          .collection('changes')
          .add({
            user_id: USER_ID,
            node_id: id,
            action: action,
            attributes: attributes,
            timestamp: ACTION_TIMESTAMP,
          })
      }
    }
  }
}

/**
 * Add changes for /node_content nodes without record in /changes
 * @param database
 * @param firestore
 */
const addNodeContentChanges = async function (database: rtdbTypes.Database, firestore: _firestore.Firestore) {
  const snapshot = await database.ref('node_content').get();
  if (!snapshot.exists()) {
    console.error(FUNCTION_LOG_NAME + " error: node_content snapshot do not exist")
    return;
  }

  for (const id in snapshot.val()) {
    if (id === '0') {
      // we do not want log root node
      continue;
    }
    for (const action of [ActionType.ContentID, ActionType.Content]) {
      console.log("searching for", id, action);

      const logSnapshot = await firestore
        .collection('changes')
        .where('node_id', '==', id)
        .where('action', '==', action)
        .limit(1)
        .get();

      if (!logSnapshot.docs || logSnapshot.docs.length == 0) {
        let attributes = {};
        if (action == ActionType.ContentID) {
          attributes = {valueAfter: id, valueBefore: null}
        } else if (action == ActionType.Content) {
          attributes = {value: snapshot.val()[id].content}
        } else {
          continue;
        }
        console.log(id, action, attributes);
        await firestore
          .collection('changes')
          .add({
            user_id: USER_ID,
            node_id: id,
            action: action,
            attributes: attributes,
            timestamp: ACTION_TIMESTAMP,
          })
      }
    }
  }
}

/**
 * Add changes for /precondition nodes without record in /changes
 * @param database
 * @param firestore
 */
const addPreconditionChanges = async function (database: rtdbTypes.Database, firestore: _firestore.Firestore) {
  const snapshot = await database.ref('precondition').get();
  if (!snapshot.exists()) {
    console.error(FUNCTION_LOG_NAME + " error: node_content snapshot do not exist")
    return;
  }

  for (const id in snapshot.val()) {
    if (id === '0') {
      // we do not want log root node
      continue;
    }
    for (const action of [ActionType.Precondition]) {
      console.log("searching for", id, action);

      const logSnapshot = await firestore
        .collection('changes')
        .where('node_id', '==', id)
        .where('action', '==', action)
        .limit(1)
        .get();

      if (!logSnapshot.docs || logSnapshot.docs.length == 0) {
        let attributes = {};
        if (action == ActionType.Precondition) {
          attributes = {
            added: snapshot.val()[id].precondition,
            removed: [],
            valueAfter: snapshot.val()[id].precondition,
            valueBefore: null,
          }
        } else {
          continue;
        }
        console.log(id, action, attributes);
        await firestore
          .collection('changes')
          .add({
            user_id: USER_ID,
            node_id: id,
            action: action,
            attributes: attributes,
            timestamp: ACTION_TIMESTAMP,
          })
      }
    }
  }
}

addMapChanges(database, firestore).then(async ()=>{
  await addNodeContentChanges(database, firestore);
  await addPreconditionChanges(database, firestore);
  process.exit();
})
