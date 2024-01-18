// if delta between previous change and current change is less than NEW_RECORD_GAP
// then two changes will be merged into one
// (NEW_RECORD_GAP is in milliseconds)
const {logger} = require("firebase-functions");
const NEW_RECORD_GAP = 1*24*60*60*1000 // days*hours*minutes*seconds*1000

// add new change
exports.insertChange = function (firestore, context, change, action, attributes){
  const now = new Date().getTime();
  return firestore
    .collection('changes')
    .add({
      user_id: context.auth.token["user_id"],
      node_id: change.after.ref.parent.getKey(),
      action: action,
      attributes: attributes,
      timestamp: now,
    })
}

// update last record for this node_id and user_id or create new one
exports.upsertChange = function (firestore, context, change, action, attributes){
  return firestore
    .collection('changes')
    .where('node_id', '==', change.after.ref.parent.getKey())
    .where('user_id', '==', context.auth.token["user_id"])
    .where('action', '==', action)
    .orderBy('timestamp', 'desc').limit(1)
    .get()
    .then((result) => {
      const now = new Date().getTime();
      if ( result.docs.length === 0 || result.docs[0].data()['timestamp'] < now - NEW_RECORD_GAP ){
        // if no history for this user or only old one - create new record
        exports.insertChange(firestore, context, change, action, attributes)
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

exports.getArrayDiff = function(arr1, arr2) {
  const beforeMap = {}
  for (const idx in arr1) {
    beforeMap[arr1[idx]] = true
  }
  const afterMap = {}
  for (const idx in arr2) {
    afterMap[arr2[idx]] = true
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


