const functions = require("firebase-functions");
const admin = require('firebase-admin');
const utils = require('./utils.js');

exports.updateWikipedia = functions.database.ref('node_content/{userID}/{nodeID}/wikipedia')
  .onWrite(async (change, context) => {
    const path = `node_content_aggregate/${context.params.nodeID}/wikipedia`
    if (change.before.exists()) {
      const key = `${path}/${change.before.val()}`;
      functions.logger.info(context.timestamp, "before", key)
      await utils.counterDecrease(key, key, context.timestamp)
    }

    if (change.after.exists()) {
      await admin.database().ref().update({
        [`node_content_aggregate/${context.params.nodeID}/nodeID`]: context.params.nodeID,
      });
      const key = `${path}/${change.after.val()}`;
      functions.logger.info(context.timestamp, "after", key)
      await utils.counterIncrease(key, key, context.timestamp)
    }
});
