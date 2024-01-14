import {ActionType, ChangeLog, ChangeLogEnriched} from "@/store/change_log";
import {QueryFilterConstraint} from "@firebase/firestore";
import {and, collection, getFirestore, onSnapshot, orderBy, query, where} from "firebase/firestore";
import firebase from "firebase/compat";

/**
 * TODO: add limit
 * @param actions
 * @param nodeIDs
 * @param cb
 */
export async function subscribeChangeLog(actions: Array<ActionType>, nodeIDs: Array<string>, cb:(changeLogs: Array<ChangeLog>)=>void) {
  const andConditions = [] as Array<QueryFilterConstraint>
  if (nodeIDs.length) {
    andConditions.push(where("node_id", "in", nodeIDs))
  }
  if (actions.length) {
    andConditions.push(where("action", "in", actions))
  }
  const q = query(
    collection(getFirestore(), "changes"),
    and(...andConditions),
    orderBy("timestamp", "desc")
  );

  return  onSnapshot(q, (snapshot) => {
    const changeLogs = [] as Array<ChangeLog>
    snapshot.forEach((doc) => {
      changeLogs.push({
        nodeID: doc.get('node_id'),
        userID: doc.get('user_id'),
        timestamp: doc.get('timestamp'),
        action: doc.get('action'),
        attributes: {
          value: doc.get('attributes.value'),
          valueBefore: doc.get('attributes.valueBefore'),
          valueAfter: doc.get('attributes.valueAfter'),
          added: doc.get('attributes.added'),
          removed: doc.get('attributes.removed'),
        },
      })
    })
    cb(changeLogs)
  });
}


/**
 * @param nodeID
 */
export async function getNodeName(nodeID: string): Promise<Record<string,string>> {
  const nodeName = {} as Record<string, string>;
  const pr = await firebase
    .database()
    .ref(`map/${nodeID}/name`)
    .get();
  if (pr.exists()) {
    nodeName[`map/${nodeID}`] = pr.val()
  } else {
    const prTrash = await firebase
      .database()
      .ref(`trash/${nodeID}/name`)
      .get();
    if (prTrash.exists()) {
      nodeName[`trash/${nodeID}`] = prTrash.val()
    }
  }

  return nodeName
}

/**
 * @param userID
 */
export async function getUserDisplayName(userID: string): Promise<Record<string,string>> {
  const userName = {} as Record<string, string>;
  const pr = await firebase
    .database()
    .ref(`public_user_data/${userID}/displayName`)
    .get();
  if (pr.exists()) {
    userName[`${userID}`] = pr.val()
  }
  return userName
}

export async function getUserDisplayNames(userIDs: Array<string>): Promise<Record<string, string>> {
  const fetches = []
  for (const userID of userIDs) {
    fetches.push(getUserDisplayName(userID))
  }
  const responses = await Promise.all(fetches)
  const result = {} as Record<string, string>
  for (const response of responses) {
    result[Object.keys(response)[0]] = Object.values(response)[0]
  }
  return result
}

// Note: realtime database charges for bandwidth and does not have batch fetch for multiple paths
// If someday we switch to Firestore this must be implemented in other way
export async function getNodeNames(nodeIDs: Array<string>): Promise<Record<string, string>> {
  const fetches = []
  for (const nodeID of nodeIDs) {
    fetches.push(getNodeName(nodeID))
  }
  const responses = await Promise.all(fetches)
  const result = {} as Record<string, string>
  for (const response of responses) {
    result[Object.keys(response)[0]] = Object.values(response)[0]
  }
  return result
}

function getPathFromNodeName(nodeID: string | null, nodeNames: Record<string, string>): string {
  if (nodeID == null) {
    return ''
  }
  let nodePath = '';
  if (nodeNames[`map/${nodeID}`] != null) {
    nodePath = `map/${nodeID}`
  } else if (nodeNames[`trash/${nodeID}`] != null) {
    nodePath = `trash/${nodeID}`
  }
  return nodePath;
}

/**
 * Same as subscribeChangeLog but enriched with username
 * @param actions
 * @param nodeIDs
 * @param cb
 */
export async function subscribeChangeLogEnriched(
  actions: Array<ActionType>,
  nodeIDs: Array<string>,
  cb:(changeLogsEnriched: Array<ChangeLogEnriched>)=>void,
) {
  return subscribeChangeLog(actions, nodeIDs, (changeLogs: Array<ChangeLog>)=>{
    // collect userIDs to request names
    // and nodeIDs to request node names
    const userNames = {} as Record<string, string>
    const nodeNames = {} as Record<string, string>
    for (const changeLog of changeLogs) {
      userNames[changeLog.userID] = ''
      nodeNames[changeLog.nodeID] = ''
      if (changeLog.action == ActionType.ParentID) {
        if (changeLog.attributes.valueBefore != null) {
          nodeNames[changeLog.attributes.valueBefore] = ''
        }
        if (changeLog.attributes.valueAfter != null) {
          nodeNames[changeLog.attributes.valueAfter] = ''
        }
      }
    }
    // fetch node and user names
    const nodeIDs = []
    for (const nodeID in nodeNames) {
      nodeIDs.push(nodeID)
    }
    const userIDs = []
    for (const userID in userNames) {
      userIDs.push(userID)
    }
    Promise.all([getNodeNames(nodeIDs), getUserDisplayNames(userIDs)]).then((resp)=>{
      const nodeNames = resp[0]
      const userNames = resp[1]
      const changeLogsEnriched = [] as Array<ChangeLogEnriched>
      changeLogs.forEach((log) => {
        const nodePath = getPathFromNodeName(log.nodeID, nodeNames)
        if (log.action == ActionType.Name) {
          changeLogsEnriched.push({
            timestamp: log.timestamp,
            action: log.action,

            userID: log.userID,
            userDisplayName: userNames[log.userID],

            nodeID: log.nodeID,
            nodeIDPath: nodePath,
            nodeName: nodeNames[nodePath],

            newName: log.attributes.value,
          })
        } else if (log.action == ActionType.Content) {
          changeLogsEnriched.push({
            timestamp: log.timestamp,
            action: log.action,

            userID: log.userID,
            userDisplayName: userNames[log.userID],

            nodeID: log.nodeID,
            nodeIDPath: nodePath,
            nodeName: nodeNames[nodePath],

            newContent: log.attributes.value,
          })
        } else if (log.action == ActionType.ParentID) {
          const beforePath = getPathFromNodeName(log.attributes.valueBefore, nodeNames)
          const afterPath = getPathFromNodeName(log.attributes.valueAfter, nodeNames)
          changeLogsEnriched.push({
            timestamp: log.timestamp,
            action: log.action,

            userID: log.userID,
            userDisplayName: userNames[log.userID],

            nodeID: log.nodeID,
            nodeIDPath: nodePath,
            nodeName: nodeNames[nodePath],

            parentNodeIDBefore: log.attributes.valueBefore,
            parentNodeIDBeforePath: beforePath,
            parentNodeBeforeName: nodeNames[beforePath],

            parentNodeIDAfter: log.attributes.valueAfter,
            parentNodeIDAfterPath: afterPath,
            parentNodeAfterName: nodeNames[afterPath],

            isRemoved: log.attributes.valueAfter == null,
            isAdded: log.attributes.valueBefore == null,
          })
        }
      })
      cb(changeLogsEnriched)
    })
  })
}
