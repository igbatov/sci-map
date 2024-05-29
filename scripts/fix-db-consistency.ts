/**
 * Check that
 * - the is no "orphan nodes" - i e every node from /map is in subtree of root node. If not REMOVE it.
 * - the is no nodes in tree without definition - i e every ID in node's children array has corresponding /map/ID
 *  with not empty name and position and correct id
 * - every node has parentID (except ROOT) and only one parent (i.e. it is in children array of only one node),
 *  If not write error in console.
 * - parentID should have this node in its children list, if not write error log about it
 * - every record in /node_content has the corresponding record in /map and if not REMOVE it
 * - every record in /precondition has the corresponding record in /map and if not REMOVE it
 * - every record in /node_image has the corresponding record in /map and if not REMOVE it
 *
 * CREATE BACKUP OF REALTIME DATABASE BEFORE RUNNING THIS SCRIPT!!!
 * (See Realtime Database backup section in README.md)
 */

import { database as rtdb } from "./bootstrap";
import * as rtdbTypes from '@firebase/database-types';
const {getArrayDiff} = require("./helpers");

const DO_REMOVE = false;
const FUNCTION_LOG_NAME = "check-db-consistency";
const ROOT_ID = "0"; // root id should always be "0"

const getPathIDs = async function (database: rtdbTypes.Database, path: string){
  const snapshot = await database.ref(path).get();
  if (!snapshot.exists()) {
    console.error(FUNCTION_LOG_NAME+" error: "+path+" snapshot do not exist")
    return;
  }
  const ids = [];
  for (const id in snapshot.val()) {
    ids.push(id.toString())
  }

  return ids;
}

const checkNodeContentIDs = async function (database: rtdbTypes.Database){
  const snapshot = await database.ref('node_content').get();
  if (!snapshot.exists()) {
    console.error(FUNCTION_LOG_NAME+" error: /node_content snapshot do not exist")
    return;
  }
  for (const id in snapshot.val()) {
    if (id.toString() !== snapshot.val()[id].nodeID.toString()) {
      console.error(FUNCTION_LOG_NAME+" error: node_content nodeID do not match key", id.toString(), snapshot.val()[id].nodeID.toString())
    }
  }
}

// get all nodes from /map in a form {
//  childrenIDs[nodeID]: [child1ID, child2ID, ...],
//  names[nodeID]: name,
// }
const getMapHash = async function (database: rtdbTypes.Database) {
  const snapshot = await database.ref('map').get();
  if (!snapshot.exists()) {
    console.error(FUNCTION_LOG_NAME+" error: map snapshot do not exist")
    return;
  }

  const childrenIDs = {} as Record<string, Array<string>>
  const names = {} as Record<string, string>
  const parentIDs = {} as Record<string, Array<string>>
  for (const id in snapshot.val()) {
    if (id.toString() !== snapshot.val()[id].id.toString()) {
      console.error(FUNCTION_LOG_NAME+" key/id mismatch in /map", id.toString(), snapshot.val()[id].id)
    }
    if (id.toString() !== ROOT_ID && (!snapshot.val()[id].name || snapshot.val()[id].name === "")) {
      console.error(FUNCTION_LOG_NAME+" empty name in /map", id.toString())
    }
    if (!snapshot.val()[id].position ||
      typeof snapshot.val()[id].position.x === 'undefined' ||
      typeof snapshot.val()[id].position.y === 'undefined') {
      console.error(FUNCTION_LOG_NAME+" empty position in /map", id.toString())
    }
    names[id.toString()] = snapshot.val()[id].name;
    const children = []
    if (snapshot.val()[id].children) {
      for (const idx in snapshot.val()[id].children) {
        children.push(snapshot.val()[id].children[idx].toString())
      }
    }
    childrenIDs[id.toString()] = children
    for (const childID of children) {
      if (typeof parentIDs[childID] === 'undefined') {
        parentIDs[childID.toString()] = [];
      }
      parentIDs[childID].push(id.toString())
    }
  }

  for (const id in parentIDs) {
    if (parentIDs[id].length>1) {
      console.error("node", id, "is in several nodes children", parentIDs[id])
    }
  }

  for (const id in snapshot.val()) {
    if (id.toString() === ROOT_ID) {
      continue
    }
    if (typeof snapshot.val()[id].parentID === 'undefined') {
      console.error(FUNCTION_LOG_NAME + " empty parentID in /map", id.toString())
    }
    if (childrenIDs[snapshot.val()[id].parentID.toString()].indexOf(id.toString()) === -1) {
      console.error("node.id is ", id.toString(), " node.parentID is ", snapshot.val()[id].parentID.toString(),
        "but parent with this id do not contain this node.id in its children IDs");
    }
  }

  return {
    childrenIDs,
    names
  };
}

/**
 * Get all ids that are in ROOT_ID subtree
 * @param children
 */
const getRootTreeIDs = function (children: Record<string, Array<string>>) {
  const subtreeIDs = [] as Array<string>;
  const stackIDs = [ROOT_ID];
  let currID = ROOT_ID;
  // traverse tree depth-first
  while (stackIDs.length > 0) {
    currID = stackIDs.pop()!;
    subtreeIDs.push(currID);
    if (children[currID].length>0) {
      stackIDs.push(...children[currID])
    }
  }
  // make it unique
  const hash = {} as Record<string, boolean>
  for (const id of subtreeIDs) {
    hash[id.toString()] = true;
  }
  return Object.keys(hash);
}

const removeNodes = async function (ids: Array<string>, names: Record<string, string>) {
  if (!DO_REMOVE) {
    return
  }
  if (ids.length === 0) {
    return
  }
  // remove orphan nodes
  console.log("!!!!removing nodes nodes!!!!")
  const updateMap = {} as Record<string, null>
  for(const id of ids) {
    console.log(id, names[id])
    updateMap["map/"+id] = null;
    updateMap["node_content/"+id] = null;
    updateMap["precondition/"+id] = null;
    updateMap["node_image/"+id] = null;
  }

  // remove from db
  return await rtdb.ref().update(updateMap)
}

const removeAbsentChildrenIDs = async function (childrenIDs: Record<string, Array<string>>) {
  const mapIDs = Object.keys(childrenIDs);
  for (const id in childrenIDs) {
    const [added, removed] = getArrayDiff(mapIDs, childrenIDs[id]);
    if (added.length > 0) {
      // added IDs are the one without /map/{id} correspondence, we need to remove them
      console.log("these ids has no corresponding /map/{id}", added);
      const newChildrenIDs = [];
      for(const chID of childrenIDs[id]) {
        if (added.indexOf(chID) > -1) {
          continue;
        }
        newChildrenIDs.push(chID)
      }
      if (DO_REMOVE) {
        await rtdb.ref("/map/"+id+"/children").set(newChildrenIDs)
      }
    }
  }
}

/**
 * CHECK AND FIX (main function starts here)
 */
getMapHash(rtdb).then(async (hash)=>{
  if (!hash) {
    console.error("cannot get hash")
    return
  }

  const childrenIDs = hash['childrenIDs'];
  const names = hash['names'];

  if (!childrenIDs) {
    console.error(FUNCTION_LOG_NAME + " empty mapIDs");
    return
  }
  const rootTreeNodeIDs = getRootTreeIDs(childrenIDs);

  // remove orphan nodes
  const [_, orphanIDs] = getArrayDiff(Object.keys(childrenIDs), rootTreeNodeIDs);
  await removeNodes(orphanIDs, names);

  // remove children IDs without /map/{id} correspondence
  await removeAbsentChildrenIDs(childrenIDs)

  // remove from /node_content, /precondition, /node_image without /map/{id} correspondence
  for (const path of ["node_content", "precondition", "node_image"]) {
    console.log(`checking ${path}`)
    const pathIDs = await getPathIDs(rtdb, path);
    const [added, removed] = getArrayDiff(Object.keys(childrenIDs), pathIDs);
    if (added && added.length > 0) {
      console.error(`/${path} has ids that are not in map`, added)
      if (DO_REMOVE) {
        const updateContent = {} as Record<string, null>
        for(const id of added) {
          updateContent["node_content/"+id] = null;
        }
        // remove from db
        return await rtdb.ref().update(updateContent)
      }
    }
  }

  // check that in /node_content nodeID always equals the key
  await checkNodeContentIDs(rtdb)

  process.exit()
})





