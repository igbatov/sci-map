const functions = require("firebase-functions");
const admin = require('firebase-admin');
const lease = require('./lease.js');

async function createNodeContentAggregateIfNeeded(nodeID, resourceID) {
  const resourceSnapshot =
    await admin.database().ref(`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}`).get();

  if (resourceSnapshot.exists()) {
    return
  }

  await admin.database().ref().update({
    [`node_content_aggregate/${nodeID}/nodeID`]: nodeID,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/resourceID`]: resourceID,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/-1`]: 0,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/1`]: 0,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/2`]: 0,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/3`]: 0,
  });
}

exports.updateResourceRating = functions.database.ref('node_content/{userID}/{nodeID}/resourceRatings/{resourceID}/rating')
  .onWrite(async (change, context) => {

    if (change.before.exists()) {
      const key = `node_content_aggregate/${context.params.nodeID}/resourceRatings/${context.params.resourceID}/rating/${change.before.val()}`;

      const [_, err] = await lease.execWithLock(async () => {
        const oldValSnap = await admin.database().ref(key).get()
        if (!oldValSnap.exists() || oldValSnap.val() <= 0) {
          return
        }
        const newVal = oldValSnap.val() - 1
        await admin.database().ref().update({
          [key]: newVal,
        })
      }, key)

      if (err != null) {
        functions.logger.error("updateResourceRating", err)
      }
    }

    if (change.after.exists()) {
      const key = `node_content_aggregate/${context.params.nodeID}/resourceRatings/${context.params.resourceID}/rating/${change.after.val()}`;
      const [_, err] = await lease.execWithLock(async () => {

        await createNodeContentAggregateIfNeeded(context.params.nodeID, context.params.resourceID)

        const oldValSnap = await admin.database().ref(key).get()
        let newVal
        if (!oldValSnap.exists() || oldValSnap.val() <= 0) {
          newVal = 1
        } else {
          newVal = oldValSnap.val() + 1
        }
        await admin.database().ref().update({
          [key]: newVal,
        })
      }, key)

      if (err != null) {
        functions.logger.error("updateResourceRating", err)
      }
    }

  });
