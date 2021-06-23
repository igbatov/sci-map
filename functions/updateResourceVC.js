const functions = require("firebase-functions");
const admin = require('firebase-admin');

/**
 * Update content of Vacancy or Crowdfunding in node_content_aggregate (allowed only to its author)
 * @type {CloudFunction<Change<DataSnapshot>>}
 */
exports.updateResourceVC = functions.database.ref('node_content/{userID}/{nodeID}/{vcType}/{vcID}')
  .onWrite(async (change, context) => {
    // update only Vacancy or Crowdfunding
    if (!["vacancies", "crowdfundingList"].includes(context.params.vcType)) {
      return
    }

    // security check
    const key = `node_content_aggregate/${context.params.nodeID}/${context.params.vcType}/${context.params.vcID}`;
    const vc = await admin.database().ref(key).get()
    if (vc.exists() && vc.val().authorID !== context.params.userID) {
      return
    }

    if (!change.after.exists()) {
      // remove from node_content_aggregate
      await admin.database().ref(key).set(null, (err) => {
        if (err) {
          functions.logger.error(err)
        }
      })
    } else {
      const afterVal = change.after.val()
      const updateObj = {
        [`${key}/authorID`]: context.params.userID
      }
      for (const fieldName in afterVal) {
        if (fieldName !== 'spam') { // field spam is updated in updateResourceSpam function
          updateObj[`${key}/${fieldName}`] = afterVal[fieldName]
        }
      }
      await admin.database().ref().update(updateObj, (err) => {
        if (err) {
          functions.logger.error(err)
        }
      })
    }
  });
