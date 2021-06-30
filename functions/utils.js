const lease = require('./lease.js');
const admin = require('firebase-admin');
const logger = require('./logger.js');

// TODO: use firebase increase here instead of self-made lease
exports.counterDecrease = async function(ctx, key, lockKey) {
  if (!lockKey) {
    logger.error(ctx, "undefined lockKey")
    return
  }
  const [_, err] = await lease.execWithLock(ctx, async () => {
    const oldValSnap = await admin.database().ref(key).get()
    // We assume that counterDecrease old value may not exists because of reorder of trigger events
    // So permit negative values for counters here (they will be increased shortly after all events will be triggered)
    let newVal = -1
    if (oldValSnap.exists() && !isNaN(oldValSnap.val())) {
      newVal = oldValSnap.val() - 1
    }

    logger.info(ctx, "counterDecrease", {key, newVal})
    await admin.database().ref().update({
      [key]: newVal,
    }, (err) => {
      if (err) {
        logger.error(ctx, "counterDecrease: update error", {err})
      }
    })
    logger.info(ctx, "counter decreased", {key, newVal})
  }, lockKey)

  if (err != null) {
    logger.error(ctx, "counterDecrease: error", {err})
  }
};

exports.counterIncrease = async function(ctx, key, lockKey) {
  if (!lockKey) {
    logger.error(ctx, "undefined lockKey")
    return
  }
  const [_, err] = await lease.execWithLock(ctx, async () => {
    const oldValSnap = await admin.database().ref(key).get()
    let newVal = 1
    if (oldValSnap.exists() && !isNaN(oldValSnap.val())) {
      newVal = oldValSnap.val() + 1
    }

    logger.info(ctx, "counterIncrease", {key, newVal})
    await admin.database().ref().update({
      [key]: newVal,
    }, (err) => {
      if (err) {
        logger.error(ctx, "counterIncrease: update error", {err})
      }
    })
    logger.info(ctx, "counter increased", {key, newVal})

  }, lockKey)

  if (err != null) {
    logger.error(ctx, "counterIncrease: error", {err})
  }
};

exports.checkIdempotence = async function(eventID) {
  const res = await admin.database().ref(`processed_event_ids/${eventID}`).transaction( (val) => {
    if (val == null) {
      return Date.now()
    }
  });

  if (res && res.committed) {
    return true
  }

  return false
}
