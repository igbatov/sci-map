const {database,  logger} = require("firebase-functions");
const {insertChange, lock, unlock, generateKey} = require("./helpers");
const {ActionType} = require("./actions");
const { nanoid } = require('nanoid');
const { Queue } = require('@datastructures-js/queue');

const LOCK_TIMEOUT_RESTORE = 60*60*1000 // 60 min
const clearState = async (db, lockNodeIDPath, lockParentIDIDPath, processCtx) => {
  logger.info("GetOnCommandRestore: clearing", processCtx)
  await db.ref('/cmd/restore').set("")
  await unlock(db, lockNodeIDPath)
  await unlock(db, lockParentIDIDPath)
  logger.info("GetOnCommandRestore: finished", processCtx)
}

const getTrashNode = async (db, nodeID, type) => {
  const pr = await db.ref(`trash/${nodeID}/${type}`).get();
  return pr.val();
}

const getMapNode = async (db, nodeID, type) => {
  const pr = await db.ref(`map/${nodeID}`).get();
  return pr.val();
}

// function that makes restore
const restoreNodeWithChildren = async (db, nodeID, parentID) => {
  const queue = new Queue();
  const updateMap = {}
  updateMap[`map/${parentID}/children/${generateKey(db)}`] = nodeID
  queue.push(nodeID)
  while (!queue.isEmpty()) {
    const currentNodeID = queue.pop()
    const mapNode = await getTrashNode(db, currentNodeID, "map")
    if (!mapNode) {
      logger.error("GetOnCommandRestore: cannot find children node in /trash", currentNodeID)
      continue
    }
    if (currentNodeID === nodeID) {
      mapNode.parentID = parentID;
    }
    const nodeContentNode = await getTrashNode(db, currentNodeID, "node_content")
    const preconditionNode = getTrashNode(db, currentNodeID, "precondition")
    const nodeImage = await getTrashNode(db, currentNodeID, "node_image")
    updateMap[`map/${currentNodeID}`] = mapNode
    updateMap[`node_content/${currentNodeID}`] = nodeContentNode
    updateMap[`precondition/${currentNodeID}`] = preconditionNode
    updateMap[`node_image/${currentNodeID}`] = nodeImage
    // remove it from trash
    updateMap[`trash/${currentNodeID}`] = null
    if (mapNode.children) {
      for (const idx in mapNode.children) {
        queue.push(mapNode.children[idx])
      }
    }
  }

  logger.info("GetOnCommandRestore: update request", updateMap)
  return await db.ref().update(updateMap);
}

// [START GetOnCommandRestore]
// Listens for /cmd/restore/{nodeId} update and do restore node action
// Concurrency:
// we need to lock nodeID (of node we restore) and parentID of its new parent
// so that
// 1) nobody will remove parent while we restore node to it
// 2) nobody will restore one node twice (maybe in different parents)
exports.GetOnCommandRestore = (firestore, db) => database.ref('/cmd/restore')
  .onUpdate(async (change, context) => {
    logger.info("GetOnCommandRestore:", change.after.val())

    // create an object to log
    const processID = nanoid()
    const processCtx = {
      processID,
      eventId: context.eventId,
      auth: context.auth,
    }

    // check that user has permissions
    if (context.auth && context.auth.token['roles']['map_editor'] !== true) {
      logger.error("GetOnCommandRestore: only admin or user with role 'map_editor' can restore node", processCtx)
      await db.ref('/cmd/remove').set("")
      return
    }

    // check nodeID is valid
    const nodeID = change.after.val()['nodeID']
    if (!nodeID) {
      logger.info("GetOnCommandRestore: got empty nodeID, exiting...", nodeID, processCtx)
      return
    }
    processCtx['nodeID'] = nodeID;

    // check parentID is valid
    const parentID = change.after.val()['parentID']
    if (!parentID) {
      logger.info("GetOnCommandRestore: got empty parentID, exiting...", parentID, processCtx)
      return
    }
    processCtx['parentID'] = parentID;

    logger.info("GetOnCommandRestore: started", processCtx)

    // try to get lock on nodeID
    const lockNodeIDPath = `nodeID/${nodeID}`
    const lockNodeIDResult = await lock(db, lockNodeIDPath, LOCK_TIMEOUT_RESTORE)
    if (!lockNodeIDResult) {
      logger.info("GetOnCommandRestore: path already locked, breaking...", lockNodeIDPath, processCtx)
      return
    }
    // try to get lock on parentID
    const lockParentIDPath = `nodeID/${parentID}`
    const lockParentIDResult = await lock(db, lockParentIDPath, LOCK_TIMEOUT_RESTORE)
    if (!lockParentIDResult) {
      logger.info("GetOnCommandRestore: path already locked, breaking...", lockParentIDPath, processCtx)
      return
    }

    logger.info("GetOnCommandRestore: got locks on nodeID and parentID, started processing", processCtx)

    // the main logic starts here
    try {
      // check that nodeID exists in /trash
      const trashNode = await getTrashNode(db, nodeID, "map")
      if (!trashNode) {
        logger.error("GetOnCommandRestore: cannot find node in /trash", nodeID)
        return
      }

      // check that parent exists in /map
      const parentNode = await getMapNode(db, parentID)
      if (!parentNode) {
        logger.error("GetOnCommandRestore: cannot find parent node in /map", parentID)
        return
      }

      // log to firestore that user restored this node
      await insertChange(firestore, context, ActionType.Restore, nodeID, {
        parentNodeID: parentID,
      })

      await restoreNodeWithChildren(db, nodeID, parentID)
      // await new Promise(r => setTimeout(r, 20000)); // for test
      await clearState(db, lockNodeIDPath, lockParentIDPath)
    } catch (e) {
      logger.error(e, processCtx)
      await clearState(db, lockNodeIDPath, lockParentIDPath)
    }
  });
// [END GetOnCommandRestore]
