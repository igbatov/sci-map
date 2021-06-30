const functions = require("firebase-functions");
const admin = require('firebase-admin');
const lease = require('./lease.js');
const utils = require('./utils.js');
const logger = require('./logger.js');

exports.updateResourceSpam = functions.database.ref('node_content/{userID}/{nodeID}/{resourceType}/{resourceID}/spam')
  .onWrite(async (change, ctx) => {
    if (!await utils.checkIdempotence(ctx.eventId)) {
      return
    }
    if (change.before.exists() && change.before.val() > 0) {
      const key = `node_content_aggregate/${ctx.params.nodeID}/${ctx.params.resourceType}/${ctx.params.resourceID}/spam/${change.before.val()}`;
      const [_, err] = await lease.execWithLock(ctx, async () => {
        const oldValSnap = await admin.database().ref(key).get()
        if (!oldValSnap.exists() || !Array.isArray(oldValSnap.val())) {
          return
        }
        // remove this userID from list of markers
        const newVal = oldValSnap.val().filter(item => item !== ctx.params.userID)
        await admin.database().ref().update({
          [key]: newVal,
        }, (err) => {
          if (err != null) {
            logger.error(ctx, "updateResourceSpam: error updating before value",  {err})
          }
        })
      }, key)

      if (err != null) {
        logger.error(ctx, "updateResourceSpam: error processing before value", {err})
      }
    }

    if (change.after.exists() && change.after.val() > 0) {
      const key = `node_content_aggregate/${ctx.params.nodeID}/${ctx.params.resourceType}/${ctx.params.resourceID}/spam/${change.after.val()}`;
      const [_, err] = await lease.execWithLock(ctx, async () => {
        const oldValSnap = await admin.database().ref(key).get()
        let newVal
        if (!oldValSnap.exists() || !Array.isArray(oldValSnap.val())) {
          newVal = [ctx.params.userID]
        } else {
          newVal = oldValSnap.val().push(ctx.params.userID)
        }
        await admin.database().ref().update({
          [key]: newVal,
        }, (err) => {
          if (err != null) {
            logger.error(ctx, "updateResourceSpam: error updating after value", {err})
          }
        })
      }, key)

      if (err != null) {
        logger.error(ctx, "updateResourceSpam: error processing after value", {err})
      }
    }
  });
