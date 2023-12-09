const {setGlobalOptions} = require("firebase-functions/v2");
setGlobalOptions({maxInstances: 10});

const functions = require('firebase-functions/v1');

const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();

const { upsertChange } = require('./helpers');
const { GetOnNodeChildrenChange, GetOnNodeParentChange} = require('./map_change');
const { onUserRoleChange } = require('./user_role');

exports.onUserRoleChange = onUserRoleChange
exports.onNodeChildrenChange = GetOnNodeChildrenChange(firestore)
exports.onNodeParentChange = GetOnNodeParentChange(firestore)

// [START onNodeContentChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.onNodeContentChange = functions.database.ref('/node_content/{nodeId}/content')
  .onWrite((change, context) => {
    return upsertChange(
      firestore,
      context,
      change,
      'content',
      {
        value: change.after.val(),
      }
    )
  });
// [END onNodeContentChange]

// [START onNodeNameChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.onNodeNameChange = functions.database.ref('/map/{nodeId}/name')
  .onWrite((change, context) => {
    return upsertChange(
      firestore,
      context,
      change,
      'name',
      {
        value: change.after.val(),
      }
    )
  });
// [END onNodeNameChange]




