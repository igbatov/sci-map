
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const {logger} = require("firebase-functions");
const {setGlobalOptions} = require("firebase-functions/v2");
setGlobalOptions({maxInstances: 10});

const functions = require('firebase-functions/v1');

admin.initializeApp();
const firestore = admin.firestore();
let date = new Date();
// if delta between previous change and current change is less than NEW_RECORD_GAP
// then two changes will be merged into one
// (NEW_RECORD_GAP is in milliseconds)
const NEW_RECORD_GAP = 60*60*1000 // minutes*seconds*1000

const upsertChange = function (change, context, action){
  firestore
    .collection('changes')
    .where('node_id', '==', change.after.ref.parent.getKey())
    .where('user_id', '==', context.auth.token["user_id"])
    .where('action', '==', action)
    .orderBy('timestamp', 'desc').limit(1)
    .get()
    .then((result) => {

      if ( result.docs.length === 0  || result.docs[0].data()['timestamp'] < date.getTime() - NEW_RECORD_GAP){
        // if no history for this user or only old one - create new record
        firestore
          .collection('changes')
          .add({
            user_id: context.auth.token["user_id"],
            node_id: change.after.ref.parent.getKey(),
            action: action,
            attributes: {
              value: change.after.val(),
            },
            timestamp: date.getTime(),
          })
      } else {
        // merge current change into latest one
        firestore
          .collection('changes')
          .doc(result.docs[0].id)
          .update({
            attributes: {
              value: change.after.val(),
            },
            timestamp: date.getTime(),
          })
      }
    });
}

// [START onNodeContentChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.onNodeContentChange = functions.database.ref('/node_content/{nodeId}/content')
  .onWrite((change, context) => {
    // find last record for this node_id and user_id
    upsertChange(change, context, 'content')
  });
// [END onNodeContentChange]

// [START onNodeNameChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.onNodeNameChange = functions.database.ref('/map/{nodeId}/name')
  .onWrite((change, context) => {
    // find last record for this node_id and user_id
    upsertChange(change, context, 'name')
  });
// [END onNodeNameChange]

// [START onUserRoleChange]
// Listens for changes in /user_role/{uid} and set roles
exports.onUserRoleChange = functions.firestore
  .document('/user_role/{uid}')
  .onWrite((change, context) => {
    // get user and set roles from /user_role/{uid}/roles
    getAuth()
      .getUser(change.after.get("user_id"))
      .then((user) => {
        // Confirm user is verified.
        if (user.emailVerified) {
          // Add custom claims for every role
          // This will be picked up by the user on token refresh or next sign in on new device.
          for (const role of change.after.get("roles")) {
            logger.log("set role for user", user.uid, role)
            getAuth().setCustomUserClaims(user.uid, {
              role: role,
            }).finally(() => {});
          }
        }
      })
      .catch((error) => {
        logger.log(error);
      });
  });
// [END onUserRoleChange]


