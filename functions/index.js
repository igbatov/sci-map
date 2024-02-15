const {setGlobalOptions} = require("firebase-functions/v2");
setGlobalOptions({maxInstances: 10});

const functions = require('firebase-functions/v1');

const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();
const database = admin.database();

const { GetOnCommandRemove } = require('./cmd_remove');
const { upsertChange, insertChange } = require('./helpers');
const {
  GetOnNodeChildrenChange,
  GetOnNodeParentChange,
  GetOnNodeNameChange,
  GetOnNodePositionChange,
  GetOnNodeMapIDChange,
} = require('./map_change');
const { GetOnPreconditionChange } = require('./precondition_change');
const { GetOnUserCreate } = require('./user_role');

exports.onUserCreate = GetOnUserCreate()
exports.onNodeChildrenChange = GetOnNodeChildrenChange(firestore)
exports.onNodeParentChange = GetOnNodeParentChange(firestore)
exports.onNodeNameChange = GetOnNodeNameChange(firestore)
exports.onPreconditionChange = GetOnPreconditionChange(firestore)
exports.onNodePositionChange = GetOnNodePositionChange(firestore)
exports.onNodeMapIDChange = GetOnNodeMapIDChange(firestore)
// there is an advice not to use REST calls, so we will imitate them changing
// https://firebase.google.com/docs/database/usage/optimize#open-connections
// /cmd/<name>/ in realtime database
// and listening for these changes to start the corresponding actions on backend
exports.onCommandRemove = GetOnCommandRemove(firestore, database)

// [START onNodeContentChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.onNodeContentChange = functions.database.ref('/node_content/{nodeId}/content')
  .onWrite((change, context) => {
    return upsertChange(
      firestore,
      context,
      'content',
      context.params.nodeId,
      {
        value: change.after.val(),
      }
    )
  });
// [END onNodeContentChange]

// [START onNodeContentIDChange]
// Listens for changes in /node_content/{nodeId}/nodeID and log them to firestore "changes" collection
// (it must be changed only on node creation anr removal)
exports.onNodeContentIDChange = functions.database.ref('/node_content/{nodeId}/nodeID')
  .onWrite((change, context) => {
    return insertChange(
      firestore,
      context,
      'content_id',
      context.params.nodeId,
      {
        after: change.after.val(),
        before: change.before.val(),
      }
    )
  });
// [END onNodeContentIDChange]






