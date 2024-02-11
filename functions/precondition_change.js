const {database,  logger} = require("firebase-functions");
const {insertChange, getArrayDiff} = require("./helpers");

// [START GetOnPreconditionChange]
// Listens for changes in /precondition/{nodeId}/ and log them to firestore "changes" collection
exports.GetOnPreconditionChange = (firestore) => database.ref('/precondition/{nodeId}')
  .onWrite((change, context) => {
    const [added, removed] = getArrayDiff(change.before.val(), change.after.val())
    return insertChange(
      firestore,
      context,
      'precondition',
      context.params.nodeId,
      {
        valueBefore: change.before.val(),
        valueAfter: change.after.val(),
        added: added,
        removed: removed,
      }
    )
  });
// [END GetOnPreconditionChange]
