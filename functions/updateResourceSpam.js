const functions = require("firebase-functions");
const admin = require('firebase-admin');
const utils = require('./utils.js');

exports.updateResourceSpam = functions.database.ref('node_content/{userID}/{nodeID}/{resourceType}/{resourceID}/spam')
  .onWrite(async (change, ctx) => {
    if (!await utils.checkIdempotence(ctx.eventId)) {
      return
    }
    if (change.before.exists() && change.before.val() > 0) {
      const key =
        `node_content_aggregate/${ctx.params.nodeID}/${ctx.params.resourceType}/${ctx.params.resourceID}/spam/${change.before.val()}/${ctx.params.userID}`;
      await admin.database().ref().update({
        [key]: admin.database.ServerValue.increment(-1)
      });
      await utils.removeIfZero(ctx, key)
    }

    if (change.after.exists() && change.after.val() > 0) {
      const key =
        `node_content_aggregate/${ctx.params.nodeID}/${ctx.params.resourceType}/${ctx.params.resourceID}/spam/${change.after.val()}/${ctx.params.userID}`;
      await admin.database().ref().update({
        [key]: admin.database.ServerValue.increment(1)
      });
      await utils.removeIfZero(ctx, key)
    }
  });
