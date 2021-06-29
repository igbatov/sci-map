const lease = require('./lease.js');
const admin = require('firebase-admin');
const functions = require("firebase-functions");

exports.counterDecrease = async function(key, lockKey, sid) {
  if (!lockKey) {
    functions.logger.error((new Date()).toISOString(), sid, "undefined lockKey")
    return
  }
  const [_, err] = await lease.execWithLock(async () => {
    const oldValSnap = await admin.database().ref(key).get()
    // We assume that counterDecrease old value may not exists because of reorder of trigger events
    // So permit negative values for counters here (they will be increased shortly after all events will be triggered)
    let newVal = -1
    if (oldValSnap.exists() && !isNaN(oldValSnap.val())) {
      newVal = oldValSnap.val() - 1
    }

    functions.logger.info((new Date()).toISOString(), sid, "counterDecrease", key, newVal)
    await admin.database().ref().update({
      [key]: newVal,
    }, (err) => {
      if (err) {
        functions.logger.error(sid, err)
      }
    })
    functions.logger.info((new Date()).toISOString(), sid, "counter decreased", key, newVal)
  }, lockKey)

  if (err != null) {
    functions.logger.error(sid, err)
  }
};

exports.counterIncrease = async function(key, lockKey, sid) {
  if (!lockKey) {
    functions.logger.error("undefined lockKey")
    return
  }
  const [_, err] = await lease.execWithLock(async () => {
    const oldValSnap = await admin.database().ref(key).get()
    let newVal = 1
    if (oldValSnap.exists() && !isNaN(oldValSnap.val())) {
      newVal = oldValSnap.val() + 1
    }

    functions.logger.info((new Date()).toISOString(), sid, "counterIncrease", key, newVal)
    await admin.database().ref().update({
      [key]: newVal,
    }, (err) => {
      if (err) {
        functions.logger.error(sid, err)
      }
    })
    functions.logger.info((new Date()).toISOString(), sid, "counter increased", key, newVal)

  }, lockKey)

  if (err != null) {
    functions.logger.error(sid, err)
  }
}
