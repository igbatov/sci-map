const {database,  logger} = require("firebase-functions");
const {insertChange, getArrayDiff} = require("./helpers");
const {ActionType} = require("./actions");

// [START GetOnPreconditionChange]
// Listens for changes in /precondition/{nodeId}/ and log them to firestore "changes" collection
exports.GetOnPreconditionChange = (firestore) => database.ref('/precondition/{nodeId}')
  .onWrite(async (change, context) => {
    const [added, removed] = getArrayDiff(change.before.val(), change.after.val())
    return await insertChange(
      firestore,
      context,
      ActionType.Precondition,
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
