const {database,  logger} = require("firebase-functions");
const {insertChange, getArrayDiff} = require("./helpers");

// [START GetOnNodeChildrenChange]
// Listens for changes in /map/{nodeId}/children and log them to firestore "changes" collection
exports.GetOnNodeChildrenChange = (firestore) => database.ref('/map/{nodeId}/children')
  .onWrite((change, context) => {
    const [added, removed] = getArrayDiff(change.before.val(), change.after.val())
    return insertChange(
      firestore,
      context,
      change,
      'children',
      {
        valueBefore: change.before.val(),
        valueAfter: change.after.val(),
        added: added,
        removed: removed,
      }
    )
  });
// [END GetOnNodeChildrenChange]

// [START GetOnNodeParentChange]
// Listens for changes in /map/{nodeId}/parentID and log them to firestore "changes" collection
exports.GetOnNodeParentChange = (firestore) => database.ref('/map/{nodeId}/parentID')
  .onWrite((change, context) => {
    return insertChange(
      firestore,
      context,
      change,
      'parentID',
      {
        valueBefore: change.before.val(),
        valueAfter: change.after.val(),
      }
    )
  });
// [END GetOnNodeParentChange]
