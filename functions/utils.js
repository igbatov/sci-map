const lease = require('./lease.js');
const admin = require('firebase-admin');
const functions = require("firebase-functions");

exports.counterDecrease = async function(key, lockKey) {
  const [_, err] = await lease.execWithLock(async () => {
    const oldValSnap = await admin.database().ref(key).get()
    if (!oldValSnap.exists() || oldValSnap.val() <= 0) {
      return
    }
    const newVal = oldValSnap.val() - 1
    await admin.database().ref().update({
      [key]: newVal,
    })
  }, lockKey)

  if (err != null) {
    functions.logger.error("updateResourceRating", err)
  }
}

exports.counterIncrease = async function(key, lockKey) {
  const [_, err] = await lease.execWithLock(async () => {
    const oldValSnap = await admin.database().ref(key).get()
    let newVal
    if (!oldValSnap.exists() || oldValSnap.val() <= 0) {
      newVal = 1
    } else {
      newVal = oldValSnap.val() + 1
    }
    await admin.database().ref().update({
      [key]: newVal,
    })
  }, lockKey)

  if (err != null) {
    functions.logger.error(err)
  }
}
