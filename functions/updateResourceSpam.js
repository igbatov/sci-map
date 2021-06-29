const functions = require("firebase-functions");
const admin = require('firebase-admin');
const lease = require('./lease.js');
const utils = require('./utils.js');

exports.updateResourceSpam = functions.database.ref('node_content/{userID}/{nodeID}/{resourceType}/{resourceID}/spam')
  .onWrite(async (change, context) => {
    if (!await utils.checkIdempotence(context.eventId)) {
      return
    }
    if (change.before.exists() && change.before.val() > 0) {
      const key = `node_content_aggregate/${context.params.nodeID}/${context.params.resourceType}/${context.params.resourceID}/spam/${change.before.val()}`;
      const [_, err] = await lease.execWithLock(async () => {
        const oldValSnap = await admin.database().ref(key).get()
        if (!oldValSnap.exists() || !Array.isArray(oldValSnap.val())) {
          return
        }
        // remove this userID from list of markers
        const newVal = oldValSnap.val().filter(item => item !== context.params.userID)
        await admin.database().ref().update({
          [key]: newVal,
        }, (err) => {
          if (err != null) {
            functions.logger.error(err)
          }
        })
      }, key)

      if (err != null) {
        functions.logger.error(err)
      }
    }

    if (change.after.exists() && change.after.val() > 0) {
      const key = `node_content_aggregate/${context.params.nodeID}/${context.params.resourceType}/${context.params.resourceID}/spam/${change.after.val()}`;
      const [_, err] = await lease.execWithLock(async () => {
        const oldValSnap = await admin.database().ref(key).get()
        let newVal
        if (!oldValSnap.exists() || !Array.isArray(oldValSnap.val())) {
          newVal = [context.params.userID]
        } else {
          newVal = oldValSnap.val().push(context.params.userID)
        }
        await admin.database().ref().update({
          [key]: newVal,
        }, (err) => {
          if (err != null) {
            functions.logger.error(err)
          }
        })
      }, key)

      if (err != null) {
        functions.logger.error(err)
      }
    }
  });
