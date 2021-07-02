const functions = require("firebase-functions");
const admin = require('firebase-admin');
const utils = require('./utils.js');
const logger = require('./logger.js');

exports.updateWikipedia = functions.database.ref('node_content/{userID}/{nodeID}/wikipedia')
  .onWrite(async (change, ctx) => {
    if (!await utils.checkIdempotence(ctx.eventId)) {
      return
    }
    const path = `node_content_aggregate/${ctx.params.nodeID}/wikipedia`
    if (change.before.exists()) {
      const key = `${path}/${change.before.val()}`;
      logger.info(ctx, "updateWikipedia: before", {key})
      await utils.counterDecrease(ctx, key)
      await utils.removeIfZero(ctx, key)
    }

    if (change.after.exists()) {
      await admin.database().ref().update({
        [`node_content_aggregate/${ctx.params.nodeID}/nodeID`]: ctx.params.nodeID,
      });
      const key = `${path}/${change.after.val()}`;
      logger.info(ctx, "updateWikipedia: after", {key})
      await utils.counterIncrease(ctx, key)
      await utils.removeIfZero(ctx, key)
    }
});
