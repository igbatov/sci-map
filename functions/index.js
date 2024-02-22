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
const { GetOnCommandSendDigest } = require('./cmd_send_digest');
const {ActionType} = require("./actions");

exports.onUserCreate = GetOnUserCreate()
exports.onCommandSendDigest = GetOnCommandSendDigest(database, firestore)
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
      ActionType.Content,
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
      ActionType.ContentID,
      context.params.nodeId,
      {
        after: change.after.val(),
        before: change.before.val(),
      }
    )
  });
// [END onNodeContentIDChange]

// [START dailyCrontab]
exports.dailyCrontab = functions.pubsub.schedule('0 16 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    functions.logger.info('started dailyCrontab 16:00 UTC');
    await database.ref('cmd/send_digest').set('daily')
    return null;
  });
// [END dailyCrontab]

// [START weeklyCrontab]
exports.weeklyCrontab = functions.pubsub.schedule('0 0 * * 5')
  .timeZone('UTC')
  .onRun(async (context) => {
    functions.logger.info('started weeklyCrontab 00:00 UTC on Friday');
    await database.ref('cmd/send_digest').set('weekly')
    return null;
  });
// [END weeklyCrontab]





