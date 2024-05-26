// if delta between previous change and current change is less than NEW_RECORD_GAP
// then two changes will be merged into one
// (NEW_RECORD_GAP is in milliseconds)
const {logger} = require("firebase-functions/v1");
const Diff = require("diff");
const NEW_RECORD_GAP = 1*24*60*60*1000 // days*hours*minutes*seconds*1000

// add new change
exports.insertChange = async function (firestore, context, action, nodeID, attributes){
  const now = new Date().getTime();
  return await firestore
    .collection('changes')
    .add({
      user_id: context.auth ? context.auth.token["user_id"] : 'function',
      node_id: nodeID,
      action: action,
      attributes: attributes,
      timestamp: now,
    })
}

// update last record for this node_id and user_id or create new one
exports.upsertChange = async function (firestore, context, action, nodeID, attributes){
  return await firestore
    .collection('changes')
    .where('node_id', '==', nodeID)
    .where('user_id', '==', context.auth ? context.auth.token["user_id"] : 'function')
    .where('action', '==', action)
    .orderBy('timestamp', 'desc').limit(1)
    .get()
    .then((result) => {
      const now = new Date().getTime();
      if ( result.docs.length === 0 || result.docs[0].data()['timestamp'] < now - NEW_RECORD_GAP ){
        // if no history for this user or only old one - create new record
        exports.insertChange(firestore, context, action, nodeID, attributes)
      } else {
        // merge current change into latest one
        return firestore
          .collection('changes')
          .doc(result.docs[0].id)
          .update({
            attributes: attributes,
            timestamp: now,
          })
      }
    });
}

exports.getArrayDiff = function(beforeArr, afterArr) {
  const beforeMap = {}
  for (const idx in beforeArr) {
    beforeMap[beforeArr[idx]] = true
  }
  const afterMap = {}
  for (const idx in afterArr) {
    afterMap[afterArr[idx]] = true
  }
  const added = []
  for (const id in afterMap) {
    if (!beforeMap[id]) {
      added.push(id)
    }
  }
  const removed = []
  for (const id in beforeMap) {
    if (!afterMap[id]) {
      removed.push(id)
    }
  }

  return [added, removed]
}

exports.getNodeLink = function(nodeName, nodeID, isRemoved) {
  if (!isRemoved) {
    return `<a target="_blank" href='https://scimap.org/${nodeID}'>${nodeName}</a>`
  } else {
    return `<a target="_blank" href='https://scimap.org/node_description/${nodeID}'>${nodeName}</a>`
  }
}

exports.getTextChangePercent = function(fromText, toText) {
  const diff = Diff.diffChars(fromText, toText);
  let added = 0
  let removed = 0
  let unchanged = 0
  diff.forEach((part) => {
    if (part.added) {
      added += part.count
    } else if (part.removed) {
      removed += part.count
    } else {
      unchanged += part.count
    }
  })

  const prevPeriodCharCount = fromText.length
  const periodCharCount = toText.length
  const maxCharCount = Math.max(prevPeriodCharCount, periodCharCount)
  return Math.floor(100*(1 - unchanged/maxCharCount));
}

/**
 * Try lock `locks/${lockID}`
 * If another concurrent function will do the same, only one will get 'true'.
 * If `locks/${lockID}` was locked more than 'timeout' than lock anyway (consider locked function died without unlocking)
 * @param admin
 * @param lockID
 * @param timeout
 * @returns {Promise<boolean>}
 */
exports.lock = async function(database, lockID, timeout) {
  const currentTimestamp = Date.now()
  const res = await database.ref(`locks/${lockID}`).transaction( (lockTimestamp) => {
    if (lockTimestamp == null) {
      return currentTimestamp
    }

    if ((currentTimestamp - lockTimestamp) > timeout) {
      // lockID is locked too long, force unlock
      return currentTimestamp
    }
    // abort the transaction by not returning a value
    // see https://firebase.google.com/docs/reference/node/firebase.database.Reference#transaction
    return;
  });

  if (res && res.committed && res.snapshot.val() === currentTimestamp) {
    return true
  }

  return false
}

/**
 * Unlock `locks/${lockID}`
 * @param database
 * @param lockID
 * @returns {Promise<void>}
 */
exports.unlock = async function (database, lockID) {
  await database.ref(`locks/${lockID}`).set(null)
}

exports.generateKey = function(db) {
  return db.ref().push().key;
}
