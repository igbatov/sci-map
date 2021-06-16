const functions = require("firebase-functions");

exports.newErrorKV = function(message, kv) {
  const err = new Error(message);

  return {
    error: err,
    kv: kv
  };
}

exports.printErrorKV = function(message, kv) {
  functions.logger.info(message, kv);
}
