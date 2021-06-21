const functions = require("firebase-functions");
const admin = require('firebase-admin');
const lease = require('./lease.js');

exports.updateResourceSpam = functions.database.ref('node_content/{userID}/{nodeID}/resourceRatings/{resourceID}/spam')
  .onWrite(async (change, context) => {
    if (!change.after.exists()) {
      // treat removal as mark "not spam"
      if (!change.before.exists()) {
        functions.logger.info("!change.after.exists() && !change.before.exists()")
        return
      }

      const key = `node_content_aggregate/${context.params.nodeID}/resourceRatings/${context.params.resourceID}/spam/${change.before.val()}`;
      const [_, err] = await lease.execWithLock(async () => {
        const oldValSnap = await admin.database().ref(key).get()
        if (!oldValSnap.exists() || oldValSnap.val() <= 0) {
          return
        }
      const newVal = oldValSnap.val() - 1
        await admin.database().ref().update({
          [key]: newVal,
          [`resources/${context.params.resourceID}/spam/${change.before.val()}`]: newVal,
        })
      }, key)

      if (err != null) {
        functions.logger.error(err)
      }

      return;
    }

    const key = `node_content_aggregate/${context.params.nodeID}/resourceRatings/${context.params.resourceID}/spam/${change.after.val()}`;
    const [_, err] = await lease.execWithLock(async () => {
      const oldValSnap = await admin.database().ref(key).get()
      let newVal
      if (!oldValSnap.exists() || oldValSnap.val() <= 0) {
        newVal = 1
      } else {
        newVal = oldValSnap.val() + 1
      }
      await admin.database().ref().update({
        [key]: newVal,
        [`resources/${context.params.resourceID}/spam/${change.after.val()}`]: newVal,
      })
    }, key)

    if (err != null) {
      functions.logger.error(err)
    }
  });
