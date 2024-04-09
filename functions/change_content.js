const functions = require("firebase-functions");
const {upsertChange, insertChange} = require("./helpers");
const {ActionType} = require("./actions");

// [START GetOnNodeContentChange]
// Listens for changes in /node_content/{nodeId}/content and log them to firestore "changes" collection
exports.GetOnNodeContentChange = (firestore) => functions.database.ref('/node_content/{nodeId}/content')
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
// [END GetOnNodeContentChange]

// [START GetOnNodeContentIDChange]
// Listens for changes in /node_content/{nodeId}/nodeID and log them to firestore "changes" collection
// (it must be changed only on node creation anr removal)
exports.GetOnNodeContentIDChange = (firestore) => functions.database.ref('/node_content/{nodeId}/nodeID')
  .onWrite(async (change, context) => {
    return await insertChange(
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
// [END GetOnNodeContentIDChange]
