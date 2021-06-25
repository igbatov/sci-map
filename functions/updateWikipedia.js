const functions = require("firebase-functions");
const admin = require('firebase-admin');
const utils = require('./utils.js');

exports.updateWikipedia = functions.database.ref('node_content/{userID}/{nodeID}/wikipedia')
  .onWrite(async (change, context) => {
    if (change.before.exists()) {
      const key = `node_content_aggregate/${context.params.nodeID}/wikipedia/${change.before.val()}`;
      await utils.counterDecrease(key)
    }

    if (change.after.exists()) {
      await admin.database().ref().update({
        [`node_content_aggregate/${context.params.nodeID}/nodeID`]: context.params.nodeID,
      });
      const key = `node_content_aggregate/${context.params.nodeID}/wikipedia/${change.after.val()}`;
      await utils.counterIncrease(key)
    }
});
