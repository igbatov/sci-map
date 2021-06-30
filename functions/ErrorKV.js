exports.newErrorKV = function(message, kv) {
  const err = new Error(message);

  return {
    error: err,
    kv: kv
  };
}
