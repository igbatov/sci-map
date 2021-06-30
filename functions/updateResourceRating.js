const functions = require("firebase-functions");
const admin = require('firebase-admin');
const utils = require('./utils.js');
const lease = require('./lease.js');
const logger = require('./logger.js');

removeAllZeroRating = async function(ctx, resourceRatingPath){
  const [_, err] = await lease.execWithLock(ctx, async () => {
    const oldValSnap = await admin.database().ref(`${resourceRatingPath}/rating`).get()
    if (!oldValSnap.exists()) {
      return
    }

    logger.info(ctx, "removeAllZeroRating: checking if all ratings zero", {resourceRatingPath})

    let isForRemoval = true;
    for (const ratingValue in oldValSnap.val()) {
      if (oldValSnap.val()[ratingValue] > 0) {
        isForRemoval = false;
        break;
      }
    }
    if (isForRemoval) {
      logger.info(ctx, "removeAllZeroRating:  all ratings zero - removing resourceRating", {resourceRatingPath})
      await admin.database().ref(`${resourceRatingPath}`).set(null)
    }
  }, resourceRatingPath)

  if (err != null) {
    logger.error(ctx, "removeAllZeroRating: error", err)
  }
}

exports.updateResourceRating = functions.database.ref('node_content/{userID}/{nodeID}/resourceRatings/{resourceID}/rating')
  .onWrite(async (change, ctx) => {
    if (!await utils.checkIdempotence(ctx.eventId)) {
      return
    }
    const resourceRatingPath = `node_content_aggregate/${ctx.params.nodeID}/resourceRatings/${ctx.params.resourceID}`
    if (change.before.exists()) {
      const key = `${resourceRatingPath}/rating/${change.before.val()}`
      await utils.counterDecrease(ctx, key, key)
    }

    if (change.after.exists()) {
      await admin.database().ref().update({
        [`node_content_aggregate/${ctx.params.nodeID}/nodeID`]: ctx.params.nodeID,
        [`node_content_aggregate/${ctx.params.nodeID}/resourceRatings/${ctx.params.resourceID}/resourceID`]: ctx.params.resourceID,
      })
      const key = `${resourceRatingPath}/rating/${change.after.val()}`
      await utils.counterIncrease(ctx, key, key)
    }

    // remove rating if everybody removed their ratings of this resource
    await removeAllZeroRating(ctx, resourceRatingPath)
  });
