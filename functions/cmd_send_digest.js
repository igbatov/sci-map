const functions = require('firebase-functions/v1');
const nodemailer = require('nodemailer');
const {ActionType} = require("./actions");
const Diff = require('diff');
const {getNodeLink, getArrayDiff} = require("./helpers");
const APP_NAME = "scimap.org"
const USER_BATCH_LIMIT = 2
const MAX_LOOP_LIMIT = 100_000
const WEEK = 7*24*60*60*1000 // days*hours*minutes*seconds*1000
const ACTIONS = [ActionType.Name, ActionType.Content, ActionType.Precondition, ActionType.ParentID, ActionType.Children, ActionType.Remove]

/**
 * getChildrenDigest
 * @param nodeID
 * @param nodeName
 * @param isNodeRemoved
 * @param added
 * @param removed
 * @returns {string}
 */
exports.getPreconditionDigest = (nodeID, nodeName, isNodeRemoved, added, removed) => {
  let text = (added && added.length) || (removed && removed.length)  ? ' - ' : ''
  if (added && added.length) {
    text += `added ${added.length} to 'based on'`
  }
  if (removed && removed.length) {
    if (added && added.length) {
      text += ' and '
    }
    text += `removed ${removed.length} from 'based on'`
  }

  return text
}

/**
 * getChildrenDigest
 * @param nodeID
 * @param nodeName
 * @param isNodeRemoved
 * @param added
 * @param removed
 * @returns {string}
 */
exports.getChildrenDigest = (nodeID, nodeName, isNodeRemoved, added, removed) => {
  let text = (added&&added.length) || (removed&&removed.length)  ? ' - has ' : ''
  if (added && added.length) {
    text += `${added.length} children added`
  }
  if (removed && removed.length) {
    if (added && added.length) {
      text += ' and '
    }
    text += `${removed.length} children removed`
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
const digestCache = {}
exports.getDigest = async (getPeriodLastChange, getPrevPeriodLastChange, getNodeName, nodeID) => {
  if (digestCache[nodeID]) {
    return digestCache[nodeID]
  }

  const [nodeName, isNodeRemoved] = await getNodeName(nodeID)
  if (nodeName === null) {
    digestCache[nodeID] = ''
    return digestCache[nodeID]
  }

  let text = `Node ${getNodeLink(nodeName, nodeID, isNodeRemoved)}:`
  const actions = {}

  for (const actionType of ACTIONS) {
    // get the latest change from the last week
    const weekLastChange = await getPeriodLastChange(nodeID, actionType)
    if (weekLastChange === null) {
      continue
    }

    if (actionType === ActionType.Remove) {
      actions[actionType] = ` - was removed`
      continue
    }

    const prevWeekLastChange = await getPrevPeriodLastChange(nodeID, actionType)
    if (prevWeekLastChange === null) {
      continue
    }

    if (prevWeekLastChange.id === weekLastChange.id) {
      // It means there is only one record in the whole history for this actionType and no diff exists
      // If actionType is in [ActionType.Content, ActionType.Name, ActionType.ParentID],
      // we think user already saw it (because she has done it herself, otherwise there will be several records in changes)
      // So skip it here
      if ([ActionType.Content, ActionType.Name, ActionType.ParentID].indexOf(actionType) !== -1) {
        continue
      }

      if (actionType === ActionType.Children) {
        actions[actionType] = exports.getChildrenDigest(
          nodeID,
          nodeName,
          isNodeRemoved,
          weekLastChange.data()['attributes']['added'],
          weekLastChange.data()['attributes']['removed'],
        )
        continue
      }

      if (actionType === ActionType.Precondition) {
        actions[actionType] = exports.getPreconditionDigest(
          nodeID,
          nodeName,
          isNodeRemoved,
          weekLastChange.data()['attributes']['added'],
          weekLastChange.data()['attributes']['removed'],
        )
        continue
      }
    }

    /**
     * Content
     * calculate the percentage of added and removed content
     * https://github.com/kpdecker/jsdiff?tab=readme-ov-file#basic-example-in-node
     */
    if (actionType === ActionType.Content) {
      const diff = Diff.diffWords(
        prevWeekLastChange.data()['attributes']['value'],
        weekLastChange.data()['attributes']['value']
      );
      let added = 0
      let removed = 0
      diff.forEach((part) => {
        if (part.added) {
          added++
        }
        if (part.removed) {
          removed++
        }
      })
      actions[actionType] = `- content changed: added ${added} words, removed ${removed} words`
    }

    /**
     * Name
     */
    if (actionType === ActionType.Name) {
      actions[actionType] = ` - changed name from "${prevWeekLastChange.data()['attributes']['value']}" to "${nodeName}"`
    }

    /**
     * Children
     */
    if (actionType === ActionType.Children) {
      const [added, removed] = getArrayDiff(prevWeekLastChange.data()['attributes']['valueAfter'], weekLastChange.data()['attributes']['valueAfter'])
      actions[actionType] = exports.getChildrenDigest(
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
      const [added, removed] = getArrayDiff(prevWeekLastChange.data()['attributes']['valueAfter'], weekLastChange.data()['attributes']['valueAfter'])
      actions[actionType] = exports.getPreconditionDigest(
        nodeID,
        nodeName,
        isNodeRemoved,
        added,
        removed,
      )
    }

    /**
     * ParentID
     */
    if (actionType === ActionType.ParentID) {
      const parentNodeID = weekLastChange.data()['attributes']['valueAfter']
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
  }

  // concatenate actions in one text
  for (const actionType in actions) {
    text += 'nbsp;nbsp;<BR>'+actions[actionType]
  }
  digestCache[nodeID] = text

  return digestCache[nodeID]
}

// [START GetOnCommandSendDigest]
// Listens for changes in /cmd/send_digest and send digests to subscribers
exports.GetOnCommandSendDigest = (database, firestore) => functions
  // Make the secret available to this function
  .runWith({ secrets: ["IGBATOVSM_PWD"] }).database.ref('/cmd/send_digest')
  .onWrite(async (change, context) => {
    if (change.after && change.after.val() === "1") {
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
            let text = ''
            for (const nodeID in snap.val()[userID]) {
              text += await exports.getDigest(
                (nodeID, actionType) => exports.getPeriodLastChange(firestore, nodeID, actionType, WEEK),
                (nodeID, actionType) => exports.getPrevPeriodLastChange(firestore, nodeID, actionType, WEEK),
                (nodeID) => exports.getNodeName(database, nodeID),
                nodeID,
              ) + "<BR><BR>"
            }
            const email = "igbatov@gmail.com"
            const mailOptions = {
              from: `${APP_NAME} <noreply@firebase.com>`,
              to: email,
            };

            // The user subscribed to the newsletter.
            mailOptions.subject = `Weekly digest from ${APP_NAME}!`;
            mailOptions.text = text;
            functions.logger.info(text)
            //await mailTransport.sendMail(mailOptions);

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
