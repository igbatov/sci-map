const functions = require('firebase-functions/v1');
const nodemailer = require('nodemailer');
const {ActionType} = require("./actions");
const Diff = require('diff');
const {getNodeLink, getArrayDiff, getTextChangePercent} = require("./helpers");
const APP_NAME = "scimap.org"
const USER_BATCH_LIMIT = 2
const MAX_LOOP_LIMIT = 100_000
const WEEK = 7*24*60*60*1000 // days*hours*minutes*seconds*1000
const DAY = 24*60*60*1000 // days*hours*minutes*seconds*1000
const ACTIONS = [
  ActionType.Name,
  ActionType.Content,
  ActionType.Precondition,
  ActionType.ParentID,
  ActionType.Children,
  ActionType.Remove,
];

/**
 * getPreconditionDigest
 * @param getNodeName
 * @param preconditionNodeIDs
 * @returns {string}
 */
exports.getPreconditionDigest = async (getNodeName, preconditionNodeIDs) => {
  if (!preconditionNodeIDs) {
    return `Empty list in 'based on'`
  }
  const nodeNames = []
  for (let nodeID of preconditionNodeIDs) {
    const [name, _] = await getNodeName(nodeID)
    nodeNames.push(name)
  }
  if (nodeNames.length === 0) {
    return `Empty list in 'based on'`
  }

  return `New list in 'based on': "${nodeNames.join('", "')}"`
}

/**
 * getChildrenDigest
 * @param getNodeName
 * @param nodeID
 * @param nodeName
 * @param isNodeRemoved
 * @param added
 * @param removed
 * @returns {string}
 */
exports.getChildrenDigest = async (getNodeName, nodeID, nodeName, isNodeRemoved, added, removed) => {
  let text = (added&&added.length) || (removed&&removed.length)  ? ' - has ' : ''

  if (added && added.length > 0) {
    const addedNames = []
    for (let nodeID of added) {
      const [name, _] = await getNodeName(nodeID)
      addedNames.push(name)
    }
    text += `${added.length} children added: "${addedNames.join('", "')}"`
  }

  if (removed && removed.length > 0) {
    if (added && added.length > 0) {
      text += ' and '
    }
    const removedNames = []
    for (let nodeID of removed) {
      const [name, _] = await getNodeName(nodeID)
      removedNames.push(name)
    }
    text += `${removed.length} children removed: "${removedNames.join('", "')}"`
  }

  return text
}

exports.getNodeName = async (database, nodeID) => {
  let node = await database.ref(`/map/${nodeID}/name`).get()
  let isNodeRemoved = false
  if (!node.exists()) {
    isNodeRemoved = true
    // node was removed, take it from trash bin
    node = await database.ref(`/trash/${nodeID}/map/name`).get()
    if (!node.exists()) {
      functions.logger.error("getDigest: cannot find node nor in /map nor in /trash", nodeID)
      return [null, isNodeRemoved]
    }
  }
  return [node.val(), isNodeRemoved]
}

exports.getPeriodLastChange = async (firestore, nodeID, actionType, period)=> {
  const periodLastChange = await firestore
    .collection('changes')
    .where('node_id', '==', nodeID)
    .where('action', '==', actionType)
    .where('timestamp', '>=', new Date().getTime() - period)
    .orderBy('timestamp', 'desc')
    .limit(1).get();

  return periodLastChange.docs.length > 0 ? periodLastChange.docs[0] : null
}

exports.getPrevPeriodLastChange = async (firestore, nodeID, actionType, period)=> {
  // get the latest change before the last week
  let prevPeriodLastChange = await firestore
    .collection('changes')
    .where('node_id', '==', nodeID)
    .where('action', '==', actionType)
    .where('timestamp', '<', new Date().getTime() - period)
    .orderBy('timestamp', 'desc')
    .limit(1).get()

  if (prevPeriodLastChange.docs.length === 0) {
    prevPeriodLastChange = await firestore
      .collection('changes')
      .where('node_id', '==', nodeID)
      .where('action', '==', actionType)
      .where('timestamp', '>=', new Date().getTime() - period)
      .orderBy('timestamp', 'asc')
      .limit(1).get()
  }

  return prevPeriodLastChange.docs.length>0 ? prevPeriodLastChange.docs[0] : null
}

/**
 * Filter firestore /changes to get digest for this nodeID
 * https://firebase.google.com/docs/firestore/query-data/order-limit-data
 * @type {{}}
 */
exports.getDigest = async (getPeriodLastChange, getPrevPeriodLastChange, getNodeName, nodeID, userID) => {
  const [nodeName, isNodeRemoved] = await getNodeName(nodeID)
  if (nodeName === null) {
    return ''
  }

  let text = `Node ${getNodeLink(nodeName, nodeID, isNodeRemoved)}:`
  const actions = {}

  for (const actionType of ACTIONS) {
    // get the latest change from the last week
    const periodLastChange = await getPeriodLastChange(nodeID, actionType)
    functions.logger.info("getPeriodLastChange", {
      "nodeID": nodeID,
      "userID": userID,
      "log_type": "digest",
      "actionType": actionType,
      "periodLastChange": periodLastChange ? periodLastChange.data() : null,
    });
    if (periodLastChange === null) {
      continue
    }

    if (actionType === ActionType.Remove) {
      actions[actionType] = ` - was removed`
      continue
    }

    const prevPeriodLastChange = await getPrevPeriodLastChange(nodeID, actionType)
    functions.logger.info("getPrevPeriodLastChange", {
      "nodeID": nodeID,
      "userID": userID,
      "log_type": "digest",
      "actionType": actionType,
      "prevPeriodLastChange": prevPeriodLastChange ? prevPeriodLastChange.data() : null,
    });

    if (prevPeriodLastChange === null) {
      continue
    }


    if (prevPeriodLastChange.id === periodLastChange.id) {
      // It means there is only one record in the whole history for this actionType and no diff exists
      // If actionType is in [ActionType.Content, ActionType.Name, ActionType.ParentID],
      // we think user already saw it (otherwise she cannot click on "Subscribe button")
      // So skip it here
      if ([ActionType.Content, ActionType.Name, ActionType.ParentID].indexOf(actionType) !== -1) {
        continue
      }

      if (actionType === ActionType.Children) {
        actions[actionType] = await exports.getChildrenDigest(
          getNodeName,
          nodeID,
          nodeName,
          isNodeRemoved,
          periodLastChange.data()['attributes']['added'],
          periodLastChange.data()['attributes']['removed'],
        )
        continue
      }

      if (actionType === ActionType.Precondition) {
        actions[actionType] = await exports.getPreconditionDigest(
          getNodeName,
          periodLastChange.data()['attributes']['valueAfter'],
        )
        continue
      }
    }

    /**
     * Content
     * calculate the percentage of content change
     * https://github.com/kpdecker/jsdiff?tab=readme-ov-file#basic-example-in-node
     */
    if (actionType === ActionType.Content) {
      const percent = getTextChangePercent(
        prevPeriodLastChange.data()['attributes']['value'],
        periodLastChange.data()['attributes']['value'],
      )
      actions[actionType] = `- ${percent}% of content changed`
    }

    /**
     * Name
     */
    if (actionType === ActionType.Name) {
      actions[actionType] = ` - changed name from "${prevPeriodLastChange.data()['attributes']['value']}" to "${nodeName}"`
    }

    /**
     * Children
     */
    if (actionType === ActionType.Children) {
      const [added, removed] = getArrayDiff(prevPeriodLastChange.data()['attributes']['valueAfter'], periodLastChange.data()['attributes']['valueAfter'])
      actions[actionType] = await exports.getChildrenDigest(
        getNodeName,
        nodeID,
        nodeName,
        isNodeRemoved,
        added,
        removed,
      )
    }

    /**
     * Precondition
     */
    if (actionType === ActionType.Precondition) {
      actions[actionType] = await exports.getPreconditionDigest(
        getNodeName,
        periodLastChange.data()['attributes']['valueAfter']
      )
    }

    /**
     * ParentID
     */
    if (actionType === ActionType.ParentID) {
      const parentNodeID = periodLastChange.data()['attributes']['valueAfter']
      if (parentNodeID === null) {
        // this case was processed in actionType === ActionType.Remove
        continue
      }
      const [parentNodeName, isParentNodeRemoved] = await getNodeName(parentNodeID)
      if (parentNodeName === null) {
        continue
      }
      actions[actionType] = ` - changed parent to ${getNodeLink(parentNodeName, parentNodeID, isParentNodeRemoved)}`
    }

    functions.logger.info("actions", {
      "userID": userID,
      "nodeID": nodeID,
      "actionType": actionType,
      "actions": actions[actionType],
      "log_type": "digest",
    });
  }

  // concatenate actions in one text
  let cnt = 0
  for (const actionType in actions) {
    cnt++
    text += '<BR>&nbsp;&nbsp;'+actions[actionType]
  }
  if (cnt>0) {
    return text
  } else {
    return ''
  }
}

// [START GetOnCommandSendDigest]
// Listens for changes in /cmd/send_digest and send digests to subscribers
exports.GetOnCommandSendDigest = (database, firestore, auth) => functions
  // Make the secret available to this function
  .runWith({ secrets: ["IGBATOVSM_PWD"] }).database.ref('/cmd/send_digest')
  .onWrite(async (change, context) => {
    const digestCache = {}
    const nodeNameCache = {}
    if (change.after && change.after.val() !== "0") {
      let period = 0
      if (change.after.val() === 'weekly') {
        period = WEEK
      } else if (change.after.val() === 'daily') {
        period = DAY
      } else {
        return
      }

      const mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: "igbatovsm@gmail.com",
          pass: process.env.IGBATOVSM_PWD,
        },
      });

      let cnt = USER_BATCH_LIMIT
      let lastKey = '0'
      let loopCnt = 0
      while (cnt === USER_BATCH_LIMIT) {
        loopCnt++
        if (loopCnt > MAX_LOOP_LIMIT) {
          // emergency break
          break;
        }
        try {
          // https://firebase.google.com/docs/database/web/lists-of-data
          const snap = await database.ref('/user_subscription').orderByKey().limitToFirst(USER_BATCH_LIMIT).startAfter(lastKey).get()
          if (!snap.exists()) {
            break;
          }

          let currCnt = 0
          for (const userID in snap.val()) {
            currCnt++

            let userSubscribePeriod = 'weekly'
            const userSnap = await database.ref(`/user_data/${userID}/subscribe_period`).get()
            if (userSnap.exists() && userSnap.val() === 'on pause') {
              lastKey = userID
              continue
            }

            if (userSnap.exists() && userSnap.val() === 'daily') {
              userSubscribePeriod = 'daily';
            }

            if (period === DAY && userSubscribePeriod !== 'daily') {
              lastKey = userID
              continue
            }
            if (period === WEEK && userSubscribePeriod !== 'weekly') {
              lastKey = userID
              continue
            }

            functions.logger.info("STARTED PROCESSING user", {
              "userID": userID,
              "log_type": "digest",
            });

            let text = ''
            for (const nodeID in snap.val()[userID]) {
              functions.logger.info("STARTED PROCESSING node", {
                "nodeID": nodeID,
                "userID": userID,
                "log_type": "digest",
              });
              try {
                let nodeDigestText = ''
                if (digestCache[nodeID]) {
                  nodeDigestText = digestCache[nodeID]
                } else {
                  nodeDigestText = await exports.getDigest(
                    (nodeID, actionType) => exports.getPeriodLastChange(firestore, nodeID, actionType, period),
                    (nodeID, actionType) => exports.getPrevPeriodLastChange(firestore, nodeID, actionType, period),
                    async (nodeID) => {
                      if (nodeNameCache[nodeID]) {
                        return [nodeNameCache[nodeID]['name'], nodeNameCache[nodeID]['isRemoved']]
                      }
                      const [name, isRemoved] = await exports.getNodeName(database, nodeID)
                      nodeNameCache[nodeID] = {
                        name,
                        isRemoved,
                      }
                      return [name, isRemoved]
                    },
                    nodeID,
                    userID,
                  )
                  digestCache[nodeID] = nodeDigestText;
                }
                if (nodeDigestText !== '') {
                  text += nodeDigestText + "<BR><BR>"
                }
              } catch (e) {
                functions.logger.error(e)
              }
            }

            const mailOptions = {
              from: `${APP_NAME} <noreply@firebase.com>`,
              subject: `Weekly digest from ${APP_NAME}!`,
              sender: `noreply@scimap.org`
            };

            if (text !== '') {
              text += '<BR><BR><a target="_blank" href="https://scimap.org/unsubscribe_digest">Unsubscribe</a>'
              mailOptions.html = text;

              const userRecord = await auth.getUser(userID);
              mailOptions.to = userRecord.toJSON().email

              functions.logger.info('mailOptions', mailOptions)
              await mailTransport.sendMail(mailOptions);
            }

            lastKey = userID
          }
          cnt = currCnt
        } catch (e) {
          functions.logger.error(e)
          break;
        }
      }

      database.ref('/cmd/send_digest').set("0")
    }
  });
// [END GetOnCommandSendDigest]
