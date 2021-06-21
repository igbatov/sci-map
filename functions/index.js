const functions = require("firebase-functions");
const admin = require('firebase-admin');
const errorKV = require('./ErrorKV.js');
const lease = require('./lease.js');
const updateResourceSpam = require('./updateResourceSpam.js');
admin.initializeApp();

exports.updateResourceSpam = updateResourceSpam.updateResourceSpam;

// thanks to https://stackoverflow.com/questions/45613769/cloud-functions-for-firebase-get-current-user-id
async function getUserID(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    return decodedToken.uid;
  } catch (e) {
    return null
  }
}

async function createNodeContentAggregateIfNeeded(nodeID, resourceID) {
  const resourceSnapshot =
    await admin.database().ref(`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}`).get();

  if (resourceSnapshot.exists()) {
    return
  }

  await admin.database().ref().update({
    [`node_content_aggregate/${nodeID}/nodeID`]: nodeID,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/resourceID`]: resourceID,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/-1`]: 0,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/1`]: 0,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/2`]: 0,
    [`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/3`]: 0,
  });
}

async function changeGeneralRating(nodeID, resourceID, oldRating, newRating) {
  if (oldRating !== 0) {
    // this is change of rating, not creation of new one
    const oldRatingSnapshot = await admin.database()
        .ref(`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/${oldRating}`).get();
    if (!oldRatingSnapshot.exists()) {
      return errorKV.newErrorKV("!oldRatingSnapshot.exists()", {})
    }

    if (Number(oldRatingSnapshot.val()) === 0) {
      errorKV.printErrorKV("error decreasing zero oldRating")
    } else {
      const newVal = Number(oldRatingSnapshot.val()) - 1
      await admin.database()
        .ref(`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/${oldRating}`)
        .set(newVal);
    }
  }

  if (newRating === 0 || newRating == null) {
    // do not track zero ratings
    // (and removal was counted in oldRating change)
    return
  }

  // check that node_content_aggregate for this node exists, if not create it with default values
  await createNodeContentAggregateIfNeeded(nodeID, resourceID)

  const newRatingSnapshot =
    await admin.database().ref(`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/${newRating}`).get();
  if (newRatingSnapshot.exists()) {
    const newVal = Number(newRatingSnapshot.val()) + 1
    await admin.database()
      .ref(`node_content_aggregate/${nodeID}/resourceRatings/${resourceID}/rating/${newRating}`)
      .set(newVal);
  }
}

async function changeLocalRating(userID, nodeID, resourceID, newRating) {
  // Get old rating from user's node_content
  let oldRatingSnapshot = await admin.database()
    .ref(`node_content/${userID}/${nodeID}/resourceRatings/${resourceID}/rating`)
    .get();

  let oldRating = null
  if (oldRatingSnapshot.exists()) {
    oldRating = oldRatingSnapshot.val()
  }

  if (newRating == oldRating) {
    // IMPORTANT: this will prevent from multiple decrease of general rating by one user
    throw new Error("newRating == oldRating");
  }

  // change local user rating
  if (newRating == null) {
    await admin.database()
      .ref(`node_content/${userID}/${nodeID}/resourceRatings/${resourceID}`)
      .set(null);
  } else {
    await admin.database()
      .ref(`node_content/${userID}/${nodeID}/resourceRatings/${resourceID}/rating`)
      .set(newRating);
  }


  return oldRating == null ? null : Number(oldRating)
}

exports.changeRating = functions.https.onRequest(async (request, response) => {
  // sanity check
  if (["-1", "0", "1", "2", "3", "null"].indexOf(request.query.newRating) == -1) {
    response.status(500).send("bad values of newRating: must be one of [\"-1\", \"0\", \"1\", \"2\", \"3\", \"null\"]");
    return
  }

  if (process.env.VUE_APP_IS_EMULATOR) {
    functions.logger.info("got VUE_APP_IS_EMULATOR=true: exposing Access-Control-Allow-Origin")
    response.set('Access-Control-Allow-Origin', '*');
  }

  const idToken = request.query.idToken
  const nodeID = request.query.nodeID
  const resourceID = request.query.resourceID
  let newRating = null
  if (request.query.newRating !== "null") {
    newRating = Number(request.query.newRating)
  }

  const userID = await getUserID(idToken)

  const [oldRating, err] = await lease.execWithLock(async () => {
    return await changeLocalRating(userID, nodeID, resourceID, newRating)
  }, `/${userID}/${nodeID}/${resourceID}`)

  if (err != null) {
    functions.logger.error(
      "got error while changeLocalRating",
      {"err": err, "request": request.query}
    );
    response.status(500).send("error");
    return
  }

  const [_, err2] = await lease.execWithLock(async () => {
    return await changeGeneralRating(nodeID, resourceID, oldRating, newRating)
  }, `/general/${nodeID}/${resourceID}`)

  if (err2 != null) {
    functions.logger.error(
      "got error while changeGeneralRating",
      {"err": err, "request": request.query}
    );
    response.status(500).send("error");
    return
  }

  response.send("success");
});
