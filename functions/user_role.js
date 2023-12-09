
// [START onUserRoleChange]
// Listens for changes in /user_role/{uid} and set roles
const {getAuth} = require("firebase-admin/auth");
const { logger, firestore} = require("firebase-functions");
const { getDatabase } = require('firebase-admin/database');
const realtimeDatabase =  getDatabase();

exports.onUserRoleChange = firestore
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
