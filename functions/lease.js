const admin = require('firebase-admin');
const logger = require('./logger.js');

const LEASE_TIMEOUT = 60*1000 // in milliseconds
const LEASE_RETRY = 1000 // in milliseconds
const LEASES_PATH = "leases"
const DEFAULT_MAX_TRIES = 1000

const lock = async function(ctx, key, maxTries) {
  if (maxTries <= 0) {
    logger.info(ctx, "Too much tries for lockLease, aborting", {key: `${LEASES_PATH}/${key}`, maxTries: maxTries})
    return;
  }

  logger.info(ctx, "going to lock", {key:`${LEASES_PATH}/${key}`})
  const res = await admin.database().ref(`${LEASES_PATH}/${key}`).transaction( (val) => {
    if (val == null) {
      return Date.now()
    }
  });

  if (res && res.committed) {
    logger.info(ctx, "successfully grabbed lease", {key: `${LEASES_PATH}/${key}`})
    return
  }

  if (!res || (res && res.snapshot && !res.snapshot.exists())) {
    logger.info(ctx, "error grabbing lease, retrying...", {key: `${LEASES_PATH}/${key}`})
    maxTries--
    const promise = new Promise(r => setTimeout(r, 2*Math.random()*LEASE_RETRY))
    await promise;
    await lock(ctx, key, maxTries)
  } else {
    const val = res.snapshot.val()
    if ((Date.now() - val) > LEASE_TIMEOUT) {
      logger.error(ctx,"lease timeout, force grabbing",{key: `${LEASES_PATH}/${key}`})
      await admin.database().ref(`${LEASES_PATH}/${key}`).set(Date.now())
    } else {
      logger.info(ctx,"lease grabbed by someone else, waiting...",{key: `${LEASES_PATH}/${key}`})
      maxTries--
      const promise = new Promise(r => setTimeout(r, 2*Math.random()*LEASE_RETRY))
      await promise;
      await lock(ctx, key, maxTries)
    }
  }
}

exports.lock = lock

exports.unlock = async function(ctx, key) {
  logger.info(ctx, "successfully released lease", {key: `${LEASES_PATH}/${key}`})
  await admin.database().ref(LEASES_PATH + "/"+ key).set(null, (e) => {
    if (e) {
      logger.error(ctx, "unlock: error", {err:e})
    }
  })
}

exports.execWithLock = async function(ctx, fn, lockKey, maxTries) {
  if (!maxTries) {
    maxTries = DEFAULT_MAX_TRIES
  }
  await exports.lock(ctx, lockKey, maxTries)
  try {
    const result = await fn()
    await exports.unlock(ctx, lockKey, maxTries)
    return [result, null]
  } catch (e) {
    await exports.unlock(ctx, lockKey, maxTries)
    return [null, e]
  }
}

