const functions = require("firebase-functions");
const admin = require('firebase-admin');
const logger = require('./logger.js');

/**
 * Update content of Vacancy or Crowdfunding in node_content_aggregate (allowed only to its author)
 * @type {CloudFunction<Change<DataSnapshot>>}
 */
exports.updateResourceVC = functions.database.ref('node_content/{userID}/{nodeID}/{vcType}/{vcID}')
  .onWrite(async (change, ctx) => {
    // no need to check for idempotence here

    // update only Vacancy or Crowdfunding
    if (!["vacancies", "crowdfundingList"].includes(ctx.params.vcType)) {
      return
    }

    // security check
    const key = `node_content_aggregate/${ctx.params.nodeID}/${ctx.params.vcType}/${ctx.params.vcID}`;
    const vc = await admin.database().ref(key).get()
    if (vc.exists() && vc.val().authorID !== ctx.params.userID) {
      return
    }

    if (!change.after.exists()) {
      // remove from node_content_aggregate
      await admin.database().ref(key).set(null, (err) => {
        if (err) {
          logger.error(ctx, "updateResourceVC: error removing from node_content_aggregate", {err})
        }
      })
    } else {
      const afterVal = change.after.val()
      const updateObj = {
        [`${key}/authorID`]: ctx.params.userID
      }
      for (const fieldName in afterVal) {
        if (fieldName !== 'spam') { // field spam is updated in updateResourceSpam function
          updateObj[`${key}/${fieldName}`] = afterVal[fieldName]
        }
      }
      await admin.database().ref().update(updateObj, (err) => {
        if (err) {
          logger.error(ctx, "updateResourceVC: error updating node_content_aggregate", {err})
        }
      })
    }
  });
