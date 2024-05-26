const {database,  logger} = require("firebase-functions/v1");
const {insertChange, getArrayDiff, upsertChange} = require("./helpers");
const {ActionType} = require("./actions");

// [START GetOnNodePositionChange]
// Listens for set /map/{nodeId}/position changed and log it to firestore "changes" collection
exports.GetOnNodePositionChange = (firestore) => database.ref('/map/{nodeId}/position')
  .onWrite((change, context) => {
    return upsertChange(
      firestore,
      context,
      ActionType.Position,
      context.params.nodeId,
      {
        value: change.after.val(),
      }
    )
  });
// [END GetOnNodePositionChange]

// [START GetOnNodeChildrenChange]
// Listens for changes in /map/{nodeId}/children and log them to firestore "changes" collection
exports.GetOnNodeChildrenChange = (firestore) => database.ref('/map/{nodeId}/children')
  .onWrite(async (change, context) => {
    const [added, removed] = getArrayDiff(change.before.val(), change.after.val())
    return await insertChange(
      firestore,
      context,
      ActionType.Children,
      context.params.nodeId,
      {
        valueBefore: change.before ? change.before.val() : null,
        valueAfter:  change.after ? change.after.val() : null,
        added: added,
        removed: removed,
      }
    )
  });
// [END GetOnNodeChildrenChange]

// [START GetOnNodeParentChange]
// Listens for changes in /map/{nodeId}/parentID and log them to firestore "changes" collection
exports.GetOnNodeParentChange = (firestore) => database.ref('/map/{nodeId}/parentID')
  .onWrite(async (change, context) => {
    return await insertChange(
      firestore,
      context,
      ActionType.ParentID,
      context.params.nodeId,
      {
        valueBefore: change.before ? change.before.val() : null,
        valueAfter:  change.after ? change.after.val() : null,
      }
    )
  });
// [END GetOnNodeParentChange]

// [START GetOnNodeNameChange]
// Listens for changes in /map/{nodeId}/name and log them to firestore "changes" collection
exports.GetOnNodeNameChange = (firestore) => database.ref('/map/{nodeId}/name')
  .onWrite((change, context) => {
    return upsertChange(
      firestore,
      context,
      ActionType.Name,
      context.params.nodeId,
      {
        value: change.after ? change.after.val() : null,
      }
    )
  });
// [END GetOnNodeNameChange]

// [START GetOnNodeIDChange]
// Listens for set /map/{nodeId}/id change and log it to firestore "changes" collection
// (id can only change on node create or delete)
exports.GetOnNodeMapIDChange = (firestore) => database.ref('/map/{nodeId}/id')
  .onWrite(async (change, context) => {
    return await insertChange(
      firestore,
      context,
      ActionType.MapID,
      context.params.nodeId,
      {
        valueBefore: change.before ? change.before.val() : null,
        valueAfter:  change.after ? change.after.val() : null,
      }
    )
  });
// [END GetOnNodeIDChange]
