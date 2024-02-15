const { getDatabase } = require('firebase-admin/database');
const realtimeDatabase =  getDatabase();
const functions = require('firebase-functions/v1');

exports.GetOnUserCreate = ()=>functions.auth.user().onCreate((user) => {
  return realtimeDatabase.ref(`/user_data/${user.uid}/map_editor`).set('true')
});
