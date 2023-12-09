// if delta between previous change and current change is less than NEW_RECORD_GAP
// then two changes will be merged into one
// (NEW_RECORD_GAP is in milliseconds)
const NEW_RECORD_GAP = 7*24*60*60*1000 // days*hours*minutes*seconds*1000

exports.upsertChange = function (change, context, action, firestore){
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
        return firestore
          .collection('changes')
          .add({
            user_id: context.auth.token["user_id"],
            node_id: change.after.ref.parent.getKey(),
            action: action,
            attributes: {
              value: change.after.val(),
            },
            timestamp: now,
          })
      } else {
        // merge current change into latest one
        return firestore
          .collection('changes')
          .doc(result.docs[0].id)
          .update({
            attributes: {
              value: change.after.val(),
            },
            timestamp: now,
          })
      }
    });
}
