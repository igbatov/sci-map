const functions = require("firebase-functions");

const INFO = "INFO"
const WARN = "WARN"
const ERROR = "ERROR"

const logger = function (severity, ctx, message, json) {
  json.context = {
    eventType: ctx.eventType,
    params: ctx.params,
    auth: {
      uid: ctx.auth.uid,
      email: ctx.auth.email,
    },
    timestamp: ctx.timestamp,
    eventId: ctx.eventId,
  }
  json.msg = message
  json.timestamp = (new Date()).toISOString()
  if (severity === INFO) {
    functions.logger.info(json)
  }
  if (severity === WARN) {
    functions.logger.warn(json)
  }
  if (severity === ERROR) {
    functions.logger.error(json)
  }
}

exports.info = function (ctx, message, json) {
  logger(INFO, ctx, message, json)
};
exports.warn = function (ctx, message, json) {
  logger(WARN, ctx, message, json)
};
exports.error = function (ctx, message, json) {
  logger(ERROR, ctx, message, json)
};

