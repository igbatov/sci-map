const functions = require("firebase-functions");
const admin = require('firebase-admin');
const logger = require('./logger.js');

exports.cleanProcessedEventIDs = functions.pubsub.schedule('0 * * * *')
  .onRun(async (ctx) => {
    logger.info(ctx, 'Running cleanProcessedEventIDs');
    const now = Date.now();
    const cutoff = now - 2 * 60 * 60 * 1000; // two hours
    const ref = admin.database().ref('processed_event_ids')
    const oldItemsQuery = ref.orderByValue().endAt(cutoff);
    await oldItemsQuery.once('value', function(snapshot) {
      // create a map with all children that need to be removed
      const updates = {};
      snapshot.forEach(function(child) {
        updates[child.key] = null
      });
      // execute all updates in one go and return the result to end the function
      return ref.update(updates);
    });
    return null;
});
