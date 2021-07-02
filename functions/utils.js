const lease = require('./lease.js');
const admin = require('firebase-admin');
const logger = require('./logger.js');

exports.counterDecrease = async function(ctx, key) {
  await admin.database().ref().update({
    [key]: admin.database.ServerValue.increment(-1)
  });
};

exports.counterIncrease = async function(ctx, key) {
  await admin.database().ref().update({
    [key]: admin.database.ServerValue.increment(1)
  });
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

exports.removeIfZero = async function(ctx, key) {
  await admin.database().ref(key).transaction( (val) => {
    // Firebase usually returns a null value while retrieving a key for the first time
    // but while saving it checks if the new value is similar to older value or not.
    // If not, firebase will run the whole process again,
    // and this time the correct value is returned by the server.
    if (val === 0 || val === null) {
      return null
    }
  });
}
