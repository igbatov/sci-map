const functions = require("firebase-functions");
const admin = require('firebase-admin');
const utils = require('./utils.js');
const lease = require('./lease.js');
const logger = require('./logger.js');

removeAllZeroRating = async function(ctx, resourceRatingPath){
  await admin.database().ref(resourceRatingPath).transaction( (ratingValues) => {
    // Firebase usually returns a null value while retrieving a key for the first time
    // but while saving it checks if the new value is similar to older value or not.
    // If not, firebase will run the whole process again,
    // and this time the correct value is returned by the server.
    if (ratingValues === null) {
      return null
    }

    logger.info(ctx, "removeAllZeroRating: checking if all ratings zero", {resourceRatingPath})

    let isForRemoval = true;
    for (const ratingValue in ratingValues) {
      if (ratingValues[ratingValue] > 0) {
        isForRemoval = false;
        break;
      }
    }
    if (isForRemoval) {
      logger.info(ctx, "removeAllZeroRating:  all ratings zero - removing resourceRating", {resourceRatingPath})
      return null
    }
  });
}

exports.updateResourceRating = functions.database.ref('node_content/{userID}/{nodeID}/resourceRatings/{resourceID}/rating')
  .onWrite(async (change, ctx) => {
    if (!await utils.checkIdempotence(ctx.eventId)) {
      return
    }
    const resourceRatingPath = `node_content_aggregate/${ctx.params.nodeID}/resourceRatings/${ctx.params.resourceID}`
    if (change.before.exists()) {
      const key = `${resourceRatingPath}/rating/${change.before.val()}`
      await utils.counterDecrease(ctx, key)
    }

    if (change.after.exists()) {
      await admin.database().ref().update({
        [`node_content_aggregate/${ctx.params.nodeID}/nodeID`]: ctx.params.nodeID,
        [`node_content_aggregate/${ctx.params.nodeID}/resourceRatings/${ctx.params.resourceID}/resourceID`]: ctx.params.resourceID,
      })
      const key = `${resourceRatingPath}/rating/${change.after.val()}`
      await utils.counterIncrease(ctx, key)
    }

    // remove rating if everybody removed their ratings of this resource
    await removeAllZeroRating(ctx, resourceRatingPath)
  });
