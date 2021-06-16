const admin = require('firebase-admin');
const functions = require("firebase-functions");

const LEASE_TIMEOUT = 60*1000 // in secs
const LEASE_RETRY = 1000 // in secs
const LEASES_PATH = "leases"
const DEFAULT_MAX_TRIES = 10

exports.lock = async function(key, maxTries) {
  await admin.database().ref(LEASES_PATH + "/"+ key).transaction(async (val) => {
    if (!val) {
      return Date.now()
    } else {
      if ((Date.now() - val) > LEASE_TIMEOUT) {
        return Date.now()
      } else {
        if (maxTries <= 0) {
          functions.logger.info("Too much tries for lockLease, aborting", "key", key, "maxTries", maxTries)
          return; // Abort the transaction.
        } else {
          maxTries--
          await new Promise(r => setTimeout(r, (1 + Math.random()*LEASE_RETRY)));
          await exports.lock(key, maxTries)
        }
      }
    }

    return;
  });
}

exports.unlock = async function(key) {
  await admin.database().ref(LEASES_PATH + "/"+ key).set(null)
}

exports.execWithLock = async function(fn, lockKey, maxTries) {
  if (!maxTries) {
    maxTries = DEFAULT_MAX_TRIES
  }
  await exports.lock(lockKey, maxTries)
  try {
    const result = await fn()
    await exports.unlock(lockKey, maxTries)
    return [result, null]
  } catch (e) {
    await exports.unlock(lockKey, maxTries)
    return [null, e]
  }
}

