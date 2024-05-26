const {database} = require("firebase-functions/v1");
const {insertChange} = require("./helpers");
const {ActionType} = require("./actions");

// [START GetOnImageChange]
// Listens for changes in /node_image/{nodeId}/ and log them to firestore "changes" collection
exports.GetOnImageChange = (firestore) => database.ref('/node_image/{nodeId}/{imageID}')
  .onWrite(async (change, context) => {
    // If not abuse each image can have max two records in history
    // - creation
    // - removal [optional]
    // Only exceptional case is change of 'default' image (i e main node image in header)
    // which can be changed multiple times.
    // Thus, history logs for images should not be large, and we can log full 'before' and 'after' values
    return await insertChange(
      firestore,
      context,
      ActionType.Image,
      context.params.nodeId,
      {
        id: context.params.imageID,
        valueBefore: change.before.val(),
        valueAfter: change.after.val(),
      }
    )
  });
// [END GetOnImageChange]
