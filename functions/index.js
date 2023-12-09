const {setGlobalOptions} = require("firebase-functions/v2");
setGlobalOptions({maxInstances: 10});

const functions = require('firebase-functions/v1');

const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();

const { upsertChange } = require('./helpers');
const { onUserRoleChange } = require('./user_role');

exports.onUserRoleChange = onUserRoleChange

// [START onNodeContentChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.onNodeContentChange = functions.database.ref('/node_content/{nodeId}/content')
  .onWrite((change, context) => {
    // find last record for this node_id and user_id
    return upsertChange(change, context, 'content', firestore)
  });
// [END onNodeContentChange]

// [START onNodeNameChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.onNodeNameChange = functions.database.ref('/map/{nodeId}/name')
  .onWrite((change, context) => {
    // find last record for this node_id and user_id
    return upsertChange(change, context, 'name', firestore)
  });
// [END onNodeNameChange]


