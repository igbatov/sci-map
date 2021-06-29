const functions = require("firebase-functions");
const admin = require('firebase-admin');
const utils = require('./utils.js');
const lease = require('./lease.js');

removeAllZeroRating = async function(resourceRatingPath){
  const [_, err] = await lease.execWithLock(async () => {
    const oldValSnap = await admin.database().ref(`${resourceRatingPath}/rating`).get()
    if (!oldValSnap.exists()) {
      return
    }

    let isForRemoval = true;
    for (const ratingValue in oldValSnap.val()) {
      if (oldValSnap.val()[ratingValue] > 0) {
        isForRemoval = false;
        break;
      }
    }
    if (isForRemoval) {
      await admin.database().ref(`${resourceRatingPath}`).set(null)
    }
  }, resourceRatingPath)

  if (err != null) {
    functions.logger.error(err)
  }
}

exports.updateResourceRating = functions.database.ref('node_content/{userID}/{nodeID}/resourceRatings/{resourceID}/rating')
  .onWrite(async (change, context) => {
    const resourceRatingPath = `node_content_aggregate/${context.params.nodeID}/resourceRatings/${context.params.resourceID}`
    if (change.before.exists()) {
      const key = `${resourceRatingPath}/rating/${change.before.val()}`
      await utils.counterDecrease(key, key)
    }

    if (change.after.exists()) {
      await admin.database().ref().update({
        [`node_content_aggregate/${context.params.nodeID}/nodeID`]: context.params.nodeID,
        [`node_content_aggregate/${context.params.nodeID}/resourceRatings/${context.params.resourceID}/resourceID`]: context.params.resourceID,
      })
      const key = `${resourceRatingPath}/rating/${change.after.val()}`
      await utils.counterIncrease(key, key)
    }

    // remove rating if everybody removed their ratings of this resource
    await removeAllZeroRating(resourceRatingPath)
  });
