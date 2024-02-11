const {database,  logger} = require("firebase-functions");
const {insertChange} = require("./helpers");

// [START GetOnCommandRemove]
// Listens for /cmd/remove/{nodeId} update and do remove action
exports.GetOnCommandRemove = (firestore, db) => database.ref('/cmd/remove')
  .onUpdate(async (change, context) => {
    if (context.auth.token['roles']['map_editor'] !== true) {
      logger.error("GetOnCommandRemove: only users with role 'map_editor' can remove nodes", context.auth)
      return
    }

    const nodeID = change.after.val()
    if (!nodeID) {
      return
    }

    const nodeMapSnap = await db.ref(`map/${nodeID}`).get();
    if (!nodeMapSnap.exists()) {
      logger.error("GetOnCommandRemove: cannot find node to remove", nodeID)
      return
    }
    const nodeMap = nodeMapSnap.val();

    const parentNodeMapSnap = await db.ref(`map/${nodeMap['parentID']}`).get();
    if (!parentNodeMapSnap.exists()) {
      logger.error("GetOnCommandRemove: cannot find parent for node", "nodeID", nodeID, "parentNodeID", nodeMap['parentID'])
      return
    }
    const parentNodeMap = parentNodeMapSnap.val();

    // log to firestore that user removed this node
    insertChange(firestore, context, "remove", nodeID, {
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
        logger.error("GetOnCommandRemove: cannot find node to remove", nodeID)
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

      // node_image
      const nodeImageSnap = await db.ref(`node_image/${id}`).get();
      let nodeImage = null
      if (nodeImageSnap.exists()) {
        nodeImage = nodeImageSnap.val()
      }

      moveToTrash[`trash/${id}/map`] = nodeMap
      moveToTrash[`map/${id}`] = null
      moveToTrash[`trash/${id}/node_content`] = nodeContent
      moveToTrash[`node_content/${id}`] = null
      moveToTrash[`trash/${id}/precondition`] = nodePrecondition
      moveToTrash[`precondition/${id}`] = null
      moveToTrash[`trash/${id}/node_image`] = nodeImage
      moveToTrash[`node_image/${id}`] = null
      if (nodeMap.children) {
        for (const idx in nodeMap.children) {
          allChildrenID.push(nodeMap.children[idx]);
        }
      }
    }
    await db.ref().update(moveToTrash)
  });
// [END GetOnCommandRemove]
