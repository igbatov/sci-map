const admin = require('firebase-admin');
const updateResourceSpam = require('./updateResourceSpam.js');
const updateResourceRating = require('./updateResourceRating.js');
const updateResourceVC = require('./updateResourceVC.js');
admin.initializeApp();

exports.updateResourceSpam = updateResourceSpam.updateResourceSpam;
exports.updateResourceRating = updateResourceRating.updateResourceRating;
exports.updateResourceVC = updateResourceVC.updateResourceVC;
