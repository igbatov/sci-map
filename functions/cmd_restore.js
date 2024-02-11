const {database,  logger} = require("firebase-functions");

// [START GetOnCommandRestore]
// Listens for set /cmd/restore/{nodeId} and do restore action
exports.GetOnCommandRestore = (admin) => database.ref('/cmd/restore/{nodeId}')
  .onWrite((change, context) => {

  });
// [END GetOnCommandRestore]
