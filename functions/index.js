
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const {logger} = require("firebase-functions");
const {setGlobalOptions} = require("firebase-functions/v2");
setGlobalOptions({maxInstances: 10});

const functions = require('firebase-functions/v1');

admin.initializeApp();
const firestore = admin.firestore();
let date = new Date();

// [START onNodeContentChange]
// Listens for changes in /node_content/{nodeId}/content and log it to firestore "changes collection"
exports.onNodeContentChange = functions.database.ref('/node_content/{nodeId}/content')
  .onWrite((change, context) => {
    // insert row to changes
    firestore.collection('changes').add({
      user_id: context.auth.token["user_id"],
      node_id: change.after.ref.parent.getKey(),
      action: "content",
      attributes: {
        value: change.after.val(),
      },
      timestamp: date.getTime(),
    })
  });
// [END onNodeContentChange]

// [START onUserRoleChange]
// Listens for changes in /node_content/{nodeId}/content and log it to firestore "changes collection"

// exports.onUserRoleChange = query
//   .onSnapshot(querySnapshot => {
//     querySnapshot.docChanges().forEach(change => {
//       if (change.type === 'added') {
//         logger.log('New city: ', change.doc.data());
//       }
//       if (change.type === 'modified') {
//         logger.log('Modified city: ', change.doc.data());
//       }
//       if (change.type === 'removed') {
//         logger.log('Removed city: ', change.doc.data());
//       }
//     });
//   });
exports.onUserRoleChange = functions.firestore
  .document('/user_role/{uid}')
  .onWrite((change, context) => {
    logger.log("change.after", change.after)
    getAuth()
      .getUser(change.after.ref["user_id"])
      .then((user) => {
        // Confirm user is verified.
        logger.log("user", user)
        if (user.emailVerified) {
          // Add custom claims for every role
          // This will be picked up by the user on token refresh or next sign in on new device.
          for (const role of change.after.ref["roles"]) {
            getAuth().setCustomUserClaims(user.uid, {
              role: role,
            }).finally((event) => {
              logger.log(event)
            });
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });
// [END onUserRoleChange]


