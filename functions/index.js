const functions = require("firebase-functions");
const admin = require('firebase-admin');
const updateResourceSpam = require('./updateResourceSpam.js');
const updateResourceRating = require('./updateResourceRating.js');
admin.initializeApp();

exports.updateResourceSpam = updateResourceSpam.updateResourceSpam;
exports.updateResourceRating = updateResourceRating.updateResourceRating;
