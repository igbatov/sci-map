const { getDatabase } = require('firebase-admin/database');
const realtimeDatabase =  getDatabase();
const functions = require('firebase-functions/v1');

exports.GetOnUserCreate = ()=>functions.auth.user().onCreate((user) => {
  // permission to edit for newly registered user
  return realtimeDatabase.ref(`/user_data/${user.uid}/map_editor`).set('false')
});
