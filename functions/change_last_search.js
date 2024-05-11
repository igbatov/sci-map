/**
 * Log every search with standard logger
 */
const {database,  logger} = require("firebase-functions");
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

// [START GetOnLastSearch]
// Listens for /user_data/{userID}/last_search update and log it
exports.GetOnLastSearch = () => database.ref('/user_data/{userID}/last_search')
  .onWrite(async (change, context) => {
    // sanitize
    if (change.after.val().length === 0 && change.after.val().length > 500) {
      // consider it abuse
      return
    }

    if (change.after.val().length > 200) {
      // consider it text quote and do not stem
      logger.info("user searched", {
        userID: context.params.userID,
        query: change.after.val(),
      })
      return;
    }

    // try to split a search query into stemmed tokens
    const tokens = tokenizer.tokenize(change.after.val())

    const logArgs = {
      userID: context.params.userID,
      query: change.after.val(),
    }
    for(let idx in tokens){
      logArgs[natural.PorterStemmer.stem(tokens[idx])] = true
    }
    logger.info("user searched", logArgs)
  });
// [END GetOnLastSearch]
