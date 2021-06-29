const admin = require('firebase-admin');
const functions = require("firebase-functions");

const LEASE_TIMEOUT = 30*1000 // in secs
const LEASE_RETRY = 1000 // in secs
const LEASES_PATH = "leases"
const DEFAULT_MAX_TRIES = 1000

const lock = async function(key, maxTries) {
  if (maxTries <= 0) {
    functions.logger.info("Too much tries for lockLease, aborting", "path", `${LEASES_PATH}/${key}`, "maxTries", maxTries)
    return;
  }

  functions.logger.info(`${LEASES_PATH}/${key}`)
  const res = await admin.database().ref(`${LEASES_PATH}/${key}`).transaction( (val) => {
    if (val == null) {
      functions.logger.info("Date.now()", Date.now())
      return Date.now()
    }
  }, (e, b, c) => {
    if (e) {
      functions.logger.error(e, b, c.exists(), c.val())
    }
  });

  if (res && res.committed) {
    functions.logger.info("successfully grabbed lease", `${LEASES_PATH}/${key}`)
    return
  }

  if (!res || (res && res.snapshot && !res.snapshot.exists())) {
    functions.logger.info((new Date()).toISOString(), "error grabbing lease, retrying...", `${LEASES_PATH}/${key}`)
    maxTries--
    const promise = new Promise(r => setTimeout(r, 2*Math.random()*LEASE_RETRY))
    await promise;
    await lock(key, maxTries)
  } else {
    const val = res.snapshot.val()
    if ((Date.now() - val) > LEASE_TIMEOUT) {
      functions.logger.error((new Date()).toISOString(), "lease timeout, force grabbing", `${LEASES_PATH}/${key}`)
      await admin.database().ref(`${LEASES_PATH}/${key}`).set(Date.now())
    } else {
      functions.logger.info((new Date()).toISOString(), "lease grabbed by someone else, waiting...", `${LEASES_PATH}/${key}`)
      maxTries--
      const promise = new Promise(r => setTimeout(r, 2*Math.random()*LEASE_RETRY))
      await promise;
      await lock(key, maxTries)
    }
  }
}

exports.lock = lock

exports.unlock = async function(key) {
  functions.logger.info((new Date()).toISOString(), "successfully released lease", `${LEASES_PATH}/${key}`)
  await admin.database().ref(LEASES_PATH + "/"+ key).set(null, (e) => {
    if (e) {
      functions.logger.error(e)
    }
  })
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

