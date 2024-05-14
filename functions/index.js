const {setGlobalOptions} = require("firebase-functions/v2");
setGlobalOptions({maxInstances: 10});

const functions = require('firebase-functions/v1');

const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();
const database = admin.database();
const auth = admin.auth();

const { GetOnLastSearch } = require('./change_last_search');
const { GetOnCommandRemove } = require('./cmd_remove');
const {
  GetOnNodeChildrenChange,
  GetOnNodeParentChange,
  GetOnNodeNameChange,
  GetOnNodePositionChange,
  GetOnNodeMapIDChange,
} = require('./change_map');
const { GetOnPreconditionChange } = require('./change_precondition');
const { GetOnUserCreate } = require('./user_role');
const { GetOnCommandSendDigest } = require('./cmd_send_digest');
const {GetOnNodeContentChange, GetOnNodeContentIDChange} = require("./change_content");
const {GetOnImageChange} = require("./change_image");
const {GetOnCommandRestore} = require("./cmd_restore");
const {GetOnCommandBackupIpfs} = require("./cmd_backup_ipfs");

// because some functions on stg should behave differentially from prod env (backups, for example)
const isProd = (process.env.GCLOUD_PROJECT === 'sci-map-1982')
functions.logger.info("isProd", isProd)

exports.onNodeContentChange = GetOnNodeContentChange(firestore)
exports.onNodeContentIDChange = GetOnNodeContentIDChange(firestore)
exports.onImageChange = GetOnImageChange(firestore)
exports.onUserCreate = GetOnUserCreate()
exports.onNodeChildrenChange = GetOnNodeChildrenChange(firestore)
exports.onNodeParentChange = GetOnNodeParentChange(firestore)
exports.onNodeNameChange = GetOnNodeNameChange(firestore)
exports.onPreconditionChange = GetOnPreconditionChange(firestore)
exports.onNodePositionChange = GetOnNodePositionChange(firestore)
exports.onNodeMapIDChange = GetOnNodeMapIDChange(firestore)
exports.onLastSearch = GetOnLastSearch()

// There is an advice not to use REST calls,
// https://firebase.google.com/docs/database/usage/optimize#open-connections
// So we will imitate them changing /cmd/<name>/ in realtime database
// and listening for these changes to start the corresponding actions on backend
exports.onCommandRemove = GetOnCommandRemove(firestore, database)
exports.onCommandRestore = GetOnCommandRestore(firestore, database)
exports.onCommandBackupIpfs = GetOnCommandBackupIpfs(firestore, database, isProd)
exports.onCommandSendDigest = GetOnCommandSendDigest(database, firestore, auth, isProd)

// [START everyHalfHourCrontab]
exports.everyHalfHourCrontab = functions.pubsub.schedule('*/30 * * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    functions.logger.info('started everyHalfHourCrontab');
    await database.ref('cmd/backup_ipfs').set('1')
    await database.ref('cmd/backup_ipfs').set('')
    return null;
  });
// [END everyHalfHourCrontab]

// [START dailyCrontab]
exports.dailyCrontab = functions.pubsub.schedule('0 16 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    functions.logger.info('started dailyCrontab 16:00 UTC');
    await database.ref('cmd/send_digest').set('daily')
    await database.ref('cmd/send_digest').set('')
    return null;
  });
// [END dailyCrontab]

// [START weeklyCrontab]
exports.weeklyCrontab = functions.pubsub.schedule('0 0 * * 5')
  .timeZone('UTC')
  .onRun(async (context) => {
    functions.logger.info('started weeklyCrontab 00:00 UTC on Friday');
    await database.ref('cmd/send_digest').set('weekly')
    await database.ref('cmd/send_digest').set('')
    return null;
  });
// [END weeklyCrontab]





