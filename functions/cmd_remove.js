const {database,  logger} = require("firebase-functions/v1");
const {insertChange, lock, unlock} = require("./helpers");
const {ActionType} = require("./actions");
const { nanoid } = require('nanoid');

// [START GetOnCommandRemove]
// Listens for /cmd/remove/{nodeId} update and do remove action
// Concurrency:
// multiple invocations of GetOnCommandRemove with the same nodeID should be OK as update() function must be atomic
// (see https://firebase.google.com/docs/database/web/read-and-write#update_specific_fields)
// (So, as it is atomic, either one of them will not find this nodeID in map or both will find full data with add children
// and write to trash/ the same data.)
//
// However, we still need lock() and unlock() to not intersect with restore function.
// (Consider restoring node into parent that is at the same time under removing)
const LOCK_TIMEOUT_REMOVE = 60*60*1000 // 60 min
// function to call in any case before return
const clearState = async (db, lockPath, processCtx) => {
  logger.info("GetOnCommandRemove: clearing", processCtx)
  await db.ref('/cmd/remove').set("")
  await unlock(db, lockPath)
  logger.info("GetOnCommandRemove: finished", processCtx)
}
exports.GetOnCommandRemove = (firestore, db) => database.ref('/cmd/remove')
  .onUpdate(async (change, context) => {
    // create an object to log
    const processID = nanoid()
    const processCtx = {
      processID,
      eventId: context.eventId,
      auth: context.auth,
    }

    // check arguments are valid
    const nodeID = change.after.val()
    if (nodeID === "0" || nodeID === 0) {
      logger.info("GetOnCommandRemove:  cannot remove root node (nodeID === '0'), exiting...", nodeID, processCtx)
      return
    }
    if (!nodeID) {
      logger.info("GetOnCommandRemove: got empty nodeID, exiting...", nodeID, processCtx)
      return
    }
    processCtx['nodeID'] = nodeID;
    logger.info("GetOnCommandRemove: started", processCtx)

    // try to get lock
    const lockPath = `nodeID/${nodeID}`
    const locked = await lock(db, lockPath, LOCK_TIMEOUT_REMOVE)
    if (!locked) {
      logger.info("GetOnCommandRemove: path already locked, breaking...", lockPath, processCtx)
      return
    }
    logger.info("GetOnCommandRemove: got lock, started processing", processCtx)

    // the main logic starts here
    try {
      const nodeMapSnap = await db.ref(`map/${nodeID}`).get();
      if (!nodeMapSnap.exists()) {
        logger.error("GetOnCommandRemove: cannot find node to remove", processCtx)
        await clearState(db, lockPath, processCtx)
        return
      }
      const nodeMap = nodeMapSnap.val();

      const parentNodeMapSnap = await db.ref(`map/${nodeMap['parentID']}`).get();
      if (!parentNodeMapSnap.exists()) {
        logger.error("GetOnCommandRemove: cannot find parent",  nodeMap['parentID'], processCtx)
        await clearState(db, lockPath, processCtx)
        return
      }
      const parentNodeMap = parentNodeMapSnap.val();

      // log to firestore that user removed this node
      await insertChange(firestore, context, ActionType.Remove, nodeID, {
        parentNodeID: nodeMap['parentID'],
      })

      const moveToTrash = {}

      // Remove nodeID from parent children
      for (const key in parentNodeMap.children) {
        if (parentNodeMap.children[key].toString() === nodeID) {
          moveToTrash[`map/${nodeMap['parentID']}/children/${key}`] = null;
          break;
        }
      }

      // for all children recursively remove them to /trash
      const allChildrenID = [nodeID];
      while (allChildrenID.length > 0) {
        const id = allChildrenID.pop();
        if (!id) {
          continue;
        }
        // /map
        const nodeMapSnap = await db.ref(`map/${id}`).get();
        if (!nodeMapSnap.exists()) {
          logger.error("GetOnCommandRemove: cannot find children to remove", nodeID, processCtx)
          continue
        }
        const nodeMap = nodeMapSnap.val();

        // /node_content
        const nodeContentSnap = await db.ref(`node_content/${id}`).get();
        let nodeContent = null
        if (nodeContentSnap.exists()) {
          nodeContent = nodeContentSnap.val()
        }

        // /precondition
        const nodePreconditionSnap = await db.ref(`precondition/${id}`).get();
        let nodePrecondition = null
        if (nodePreconditionSnap.exists()) {
          nodePrecondition = nodePreconditionSnap.val()
        }

        // /node_image
        const nodeImageSnap = await db.ref(`node_image/${id}`).get();
        let nodeImage = null
        if (nodeImageSnap.exists()) {
          nodeImage = nodeImageSnap.val()
        }

        moveToTrash[`trash/${id}/timestamp`] = new Date().getTime();
        moveToTrash[`trash/${id}/map`] = nodeMap;
        moveToTrash[`map/${id}`] = null;
        moveToTrash[`trash/${id}/node_content`] = nodeContent;
        moveToTrash[`node_content/${id}`] = null;
        moveToTrash[`trash/${id}/precondition`] = nodePrecondition;
        moveToTrash[`precondition/${id}`] = null;
        moveToTrash[`trash/${id}/node_image`] = nodeImage;
        moveToTrash[`node_image/${id}`] = null;
        if (nodeMap.children) {
          for (const idx in nodeMap.children) {
            allChildrenID.push(nodeMap.children[idx]);
          }
        }
      }

      // atomic save to DB
      await db.ref().update(moveToTrash)
      await clearState(db, lockPath, processCtx)
    } catch (e) {
      logger.error(e, processCtx)
      await clearState(db, lockPath, processCtx)
    }
  });
// [END GetOnCommandRemove]
