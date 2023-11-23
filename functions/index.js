
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const {logger} = require("firebase-functions");
const {setGlobalOptions} = require("firebase-functions/v2");
setGlobalOptions({maxInstances: 10});

const functions = require('firebase-functions/v1');
const { getDatabase } = require('firebase-admin/database');

admin.initializeApp();
const realtimeDatabase =  getDatabase();
const firestore = admin.firestore();
// if delta between previous change and current change is less than NEW_RECORD_GAP
// then two changes will be merged into one
// (NEW_RECORD_GAP is in milliseconds)
const NEW_RECORD_GAP = 60*60*1000 // minutes*seconds*1000

const upsertChange = function (change, context, action){
  return firestore
    .collection('changes')
    .where('node_id', '==', change.after.ref.parent.getKey())
    .where('user_id', '==', context.auth.token["user_id"])
    .where('action', '==', action)
    .orderBy('timestamp', 'desc').limit(1)
    .get()
    .then((result) => {
      const now = new Date().getTime();
      if ( result.docs.length === 0 || result.docs[0].data()['timestamp'] < now - NEW_RECORD_GAP ){
        // if no history for this user or only old one - create new record
        return firestore
          .collection('changes')
          .add({
            user_id: context.auth.token["user_id"],
            node_id: change.after.ref.parent.getKey(),
            action: action,
            attributes: {
              value: change.after.val(),
            },
            timestamp: now,
          })
      } else {
        // merge current change into latest one
        return firestore
          .collection('changes')
          .doc(result.docs[0].id)
          .update({
            attributes: {
              value: change.after.val(),
            },
            timestamp: now,
          })
      }
    });
}

// [START onNodeContentChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.onNodeContentChange = functions.database.ref('/node_content/{nodeId}/content')
  .onWrite((change, context) => {
    // find last record for this node_id and user_id
    return upsertChange(change, context, 'content')
  });
// [END onNodeContentChange]

// [START onNodeNameChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.onNodeNameChange = functions.database.ref('/map/{nodeId}/name')
  .onWrite((change, context) => {
    // find last record for this node_id and user_id
    return upsertChange(change, context, 'name')
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
        const roleMap = {}
        for (const role in user.customClaims) {
          roleMap[role] = null
        }
        for (const role of change.after.get("roles")) {
          roleMap[role] = true
        }
        return getAuth().setCustomUserClaims(user.uid, {roles: roleMap}).then(() => {

          // revoke token after claims change
          let revokeTime
          getAuth()
            .revokeRefreshTokens(user.uid)
            .then(() => {
              return getAuth().getUser(user.uid);
            })
            .then((userRecord) => {
              revokeTime = new Date(userRecord.tokensValidAfterTime).getTime() / 1000
              return revokeTime;
            })
            .then((timestamp) => {
              logger.log('Tokens revoked', timestamp, user.uid);

              // update revokeTime in realtime database /user_data/{uid}/revokeTime
              // so that security rules can detect the time token was revoked
              // (see https://firebase.google.com/docs/auth/admin/manage-sessions)
              return realtimeDatabase.ref(`/user_data/${user.uid}/revokeTime`).set(revokeTime)
            })
        })
      })
      .catch((error) => {
        logger.log(error);
      });
  });
// [END onUserRoleChange]


