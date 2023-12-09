const {database,  logger} = require("firebase-functions");
const {insertChange} = require("./helpers");

// [START GetOnNodeChildrenChange]
// Listens for changes in /map/{nodeId}/children and log them to firestore "changes" collection
exports.GetOnNodeChildrenChange = (firestore) => database.ref('/map/{nodeId}/children')
  .onWrite((change, context) => {
    const beforeMap = {}
    logger.log(change.before.val())
    for (const idx in change.before.val()) {
      beforeMap[change.before.val()[idx]] = true
    }
    const afterMap = {}
    for (const idx in change.after.val()) {
      afterMap[change.after.val()[idx]] = true
    }
    const added = []
    for (const id in afterMap) {
      if (!beforeMap[id]) {
        added.push(id)
      }
    }
    const removed = []
    for (const id in beforeMap) {
      if (!afterMap[id]) {
        removed.push(id)
      }
    }
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
