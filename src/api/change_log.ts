import { ActionType, ChangeLog, ChangeLogEnriched } from "@/store/change_log";
import { QueryFilterConstraint, QueryNonFilterConstraint } from "@firebase/firestore";
import {
  and,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";
import firebase from "firebase/compat";

/**
 * TODO: add limit
 * @param actions
 * @param nodeIDs
 * @param userIDs
 * @param fromTs
 * @param toTs
 * @param limitNum
 * @param cb
 */
export async function subscribeChangeLog(
  actions: Array<ActionType>,
  nodeIDs: Array<string>,
  userIDs: Array<string>,
  fromTs: number,
  toTs: number,
  limitNum: number,
  cb: (changeLogs: Array<ChangeLog>) => void
) {
  const andConditions = [] as Array<QueryFilterConstraint>;
  if (nodeIDs.length) {
    andConditions.push(where("node_id", "in", nodeIDs));
  }
  if (actions.length) {
    andConditions.push(where("action", "in", actions));
  }
  if (userIDs.length) {
    andConditions.push(where("user_id", "in", userIDs));
  }
  if (fromTs>0) {
    andConditions.push(where("timestamp", ">=", fromTs));
  }
  if (toTs>0) {
    andConditions.push(where("timestamp", "<=", toTs));
  }
  // 'remove' and 'restore' changes is made by firebase functions (but logged anyway in firestore)
  // here we skip most details made by function and show only action made by user
  andConditions.push(where("user_id", "!=", "function"));

  const nonFilterConstraint = [] as Array<QueryNonFilterConstraint>
  nonFilterConstraint.push(orderBy("timestamp", "desc"));
  if (limitNum>0) {
    nonFilterConstraint.push(limit(limitNum));
  }
  const q = query(
    collection(getFirestore(), "changes"),
    and(...andConditions),
    ...nonFilterConstraint,
  );

  return onSnapshot(q, snapshot => {
    const changeLogs = [] as Array<ChangeLog>;
    snapshot.forEach(doc => {
      changeLogs.push({
        changeLogID: doc.id,
        nodeID: doc.get("node_id"),
        userID: doc.get("user_id"),
        timestamp: doc.get("timestamp"),
        action: doc.get("action"),
        attributes: {
          value: doc.get("attributes.value"),
          valueBefore: doc.get("attributes.valueBefore"),
          valueAfter: doc.get("attributes.valueAfter"),
          added: doc.get("attributes.added"),
          removed: doc.get("attributes.removed"),
          parentNodeID: doc.get("attributes.parentNodeID"),
        }
      });
    });
    cb(changeLogs);
  });
}

/**
 * @param nodeID
 */
export async function getNodeName(
  nodeID: string
): Promise<Record<string, string>> {
  const nodeName = {} as Record<string, string>;
  const pr = await firebase
    .database()
    .ref(`map/${nodeID}/name`)
    .get();
  if (pr.exists()) {
    nodeName[`map/${nodeID}`] = pr.val();
  } else {
    const prTrash = await firebase
      .database()
      .ref(`trash/${nodeID}/map/name`)
      .get();
    if (prTrash.exists()) {
      nodeName[`trash/${nodeID}`] = prTrash.val();
    }
  }

  return nodeName;
}

/**
 * @param userID
 */
export async function getUserDisplayName(
  userID: string
): Promise<Record<string, string>> {
  const userName = {} as Record<string, string>;
  const pr = await firebase
    .database()
    .ref(`public_user_data/${userID}/displayName`)
    .get();
  if (pr.exists()) {
    userName[`${userID}`] = pr.val();
  }
  return userName;
}

export async function getUserDisplayNames(
  userIDs: Array<string>
): Promise<Record<string, string>> {
  const fetches = [];
  for (const userID of userIDs) {
    fetches.push(getUserDisplayName(userID));
  }
  const responses = await Promise.all(fetches);
  const result = {} as Record<string, string>;
  for (const response of responses) {
    result[Object.keys(response)[0]] = Object.values(response)[0];
  }
  return result;
}

// Note: realtime database charges for bandwidth and does not have batch fetch for multiple paths
// If someday we switch to Firestore, this must be implemented in another way
export async function getNodeNames(
  nodeIDs: Array<string>
): Promise<Record<string, string>> {
  const fetches = [];
  for (const nodeID of nodeIDs) {
    fetches.push(getNodeName(nodeID));
  }
  const responses = await Promise.all(fetches);
  const result = {} as Record<string, string>;
  for (const response of responses) {
    result[Object.keys(response)[0]] = Object.values(response)[0];
  }
  return result;
}

function getPathFromNodeName(
  nodeID: string | null,
  nodeNames: Record<string, string>
): string {
  if (nodeID == null) {
    return "";
  }
  let nodePath = "";
  if (nodeNames[`map/${nodeID}`] != null) {
    nodePath = `map/${nodeID}`;
  } else if (nodeNames[`trash/${nodeID}`] != null) {
    nodePath = `trash/${nodeID}`;
  }
  return nodePath;
}

/**
 * Same as subscribeChangeLog but enriched with username
 * @param actions
 * @param nodeIDs
 * @param userIDs
 * @param fromTs
 * @param toTs
 * @param limitNum
 * @param cb
 */
export async function subscribeChangeLogEnriched(
  actions: Array<ActionType>,
  nodeIDs: Array<string>,
  userIDs: Array<string>,
  fromTs: number,
  toTs: number,
  limitNum: number,
  cb: (changeLogsEnriched: Array<ChangeLogEnriched>) => void
) {
  return subscribeChangeLog(
    actions,
    nodeIDs,
    userIDs,
    fromTs,
    toTs,
    limitNum,
    (changeLogs: Array<ChangeLog>) => {
      // changeLogs must be in ascending order for prevContent logic to work properly (see below oldContent calculation)
      changeLogs.sort((a, b) =>  a.timestamp - b.timestamp);

      // collect userIDs to request names
      // and nodeIDs to request node names
      const userNames = {} as Record<string, string>;
      const nodeNames = {} as Record<string, string>;
      for (const changeLog of changeLogs) {
        userNames[changeLog.userID] = "";
        nodeNames[changeLog.nodeID] = "";
        if (changeLog.action == ActionType.ParentID) {
          if (changeLog.attributes.valueBefore != null) {
            nodeNames[changeLog.attributes.valueBefore] = "";
          }
          if (changeLog.attributes.valueAfter != null) {
            nodeNames[changeLog.attributes.valueAfter] = "";
          }
        }
        if (changeLog.action == ActionType.Restore) {
          if (changeLog.attributes.parentNodeID != null) {
            nodeNames[changeLog.attributes.parentNodeID] = "";
          }
        }
        if (changeLog.action == ActionType.Precondition) {
          if (changeLog.attributes.removed != null) {
            for (const id of changeLog.attributes.removed) {
              nodeNames[id] = "";
            }
          }
          if (changeLog.attributes.added != null) {
            for (const id of changeLog.attributes.added) {
              nodeNames[id] = "";
            }
          }
        }
      }
      // fetch node and usernames
      const nodeIDs = [];
      for (const nodeID in nodeNames) {
        nodeIDs.push(nodeID);
      }
      const userIDs = [];
      for (const userID in userNames) {
        userIDs.push(userID);
      }
      Promise.all([getNodeNames(nodeIDs), getUserDisplayNames(userIDs)]).then(
        resp => {
          const nodeNames = resp[0];
          const userNames = resp[1];
          const changeLogsEnriched = [] as Array<ChangeLogEnriched>;
          const prevNodeName = {} as Record<string, string>;
          const prevNodeContent = {} as Record<string, string>;
          changeLogs.forEach(log => {
            const userDisplayName = userNames[log.userID] && userNames[log.userID].length > 0 ? userNames[log.userID] : log.userID.substring(log.userID.length-8, log.userID.length-1)
            const nodePath = getPathFromNodeName(log.nodeID, nodeNames);
            if (log.action == ActionType.Name) {
              changeLogsEnriched.push({
                changeLogID: log.changeLogID,

                timestamp: log.timestamp,
                action: log.action,

                userID: log.userID,
                userDisplayName,

                node: {
                  id: log.nodeID,
                  idPath: nodePath,
                  name: nodeNames[nodePath]
                },

                newName: log.attributes.value,
                oldName: prevNodeName[log.nodeID]
              });
              prevNodeName[log.nodeID] =  log.attributes.value;

            } else if (log.action == ActionType.Content) {
              changeLogsEnriched.push({
                changeLogID: log.changeLogID,

                timestamp: log.timestamp,
                action: log.action,

                userID: log.userID,
                userDisplayName,

                node: {
                  id: log.nodeID,
                  idPath: nodePath,
                  name: nodeNames[nodePath]
                },

                newContent: log.attributes.value,
                oldContent: prevNodeContent[log.nodeID],
              });
              prevNodeContent[log.nodeID] = log.attributes.value;

            } else if (log.action == ActionType.Precondition) {
              const removed = [];
              if (log.attributes.removed) {
                for (const id of log.attributes.removed) {
                  removed.push({
                    id: id,
                    idPath: getPathFromNodeName(id, nodeNames),
                    name: nodeNames[getPathFromNodeName(id, nodeNames)]
                  });
                }
              }
              const added = [];
              if (log.attributes.added) {
                for (const id of log.attributes.added) {
                  added.push({
                    id: id,
                    idPath: getPathFromNodeName(id, nodeNames),
                    name: nodeNames[getPathFromNodeName(id, nodeNames)]
                  });
                }
              }

              changeLogsEnriched.push({
                changeLogID: log.changeLogID,

                timestamp: log.timestamp,
                action: log.action,

                userID: log.userID,
                userDisplayName,

                node: {
                  id: log.nodeID,
                  idPath: nodePath,
                  name: nodeNames[nodePath]
                },

                removed,
                added
              });
            } else if (log.action == ActionType.ParentID) {
              // note that as nodes are removed by function (function/cmd_remove.js) records with
              // action === 'parentID' && log.attributes.valueAfter === null
              // should always have user_id === 'function'
              // and thus must be filtered out in subscribeChangeLog()
              // (as it has condition user_id !== 'function')
              const beforePath = getPathFromNodeName(
                log.attributes.valueBefore,
                nodeNames
              );
              const afterPath = getPathFromNodeName(
                log.attributes.valueAfter,
                nodeNames
              );
              changeLogsEnriched.push({
                changeLogID: log.changeLogID,

                timestamp: log.timestamp,
                action: log.action,

                userID: log.userID,
                userDisplayName,

                node: {
                  id: log.nodeID,
                  idPath: nodePath,
                  name: nodeNames[nodePath]
                },

                parentNodeBefore: {
                  id: log.attributes.valueBefore,
                  idPath: beforePath,
                  name: nodeNames[beforePath]
                },

                parentNodeAfter: {
                  id: log.attributes.valueAfter,
                  idPath: afterPath,
                  name: nodeNames[afterPath]
                },

                isRemoved: false,
                isAdded: log.attributes.valueBefore == null
              });
            } else if (log.action == ActionType.Remove) {
              const beforePath = getPathFromNodeName(
                log.attributes.parentNodeID,
                nodeNames
              );
              changeLogsEnriched.push({
                changeLogID: log.changeLogID,

                timestamp: log.timestamp,
                action: log.action,

                userID: log.userID,
                userDisplayName,

                node: {
                  id: log.nodeID,
                  idPath: nodePath,
                  name: nodeNames[nodePath]
                },

                parentNodeBefore: {
                  id: log.attributes.parentNodeID,
                  idPath: beforePath,
                  name: nodeNames[beforePath]
                },

                parentNodeAfter: null,

                isRemoved: true,
                isAdded: false
              });
            } else if (log.action == ActionType.Restore) {
              const afterPath = getPathFromNodeName(
                log.attributes.parentNodeID,
                nodeNames
              );
              changeLogsEnriched.push({
                changeLogID: log.changeLogID,

                timestamp: log.timestamp,
                action: log.action,

                userID: log.userID,
                userDisplayName,

                node: {
                  id: log.nodeID,
                  idPath: nodePath,
                  name: nodeNames[nodePath]
                },

                parentNodeBefore: null,

                parentNodeAfter: {
                  id: log.attributes.parentNodeID,
                  idPath: afterPath,
                  name: nodeNames[afterPath]
                },

                isRemoved: false,
                isAdded: true
              });
            }
          });

          // on UI we want new records first
          changeLogsEnriched.sort((a,b) => b.timestamp - a.timestamp);
          cb(changeLogsEnriched);
        }
      );
    }
  );
}

export function IsNodeInTrash(nodeIDPath: string): boolean {
  return nodeIDPath.startsWith("trash")
}

export function GetNodeHref(nodeIDPath: string, nodeID: string) {
  if (IsNodeInTrash(nodeIDPath)) {
    return `/node_description/${nodeID}`
  } else {
    return `/${nodeID}`
  }
}
export function GetNodeLink(
  nodeIDPath: string,
  nodeID: string,
  nodeName: string
): string {
    return `<a target="_blank" href="${GetNodeHref(nodeIDPath, nodeID)}">${nodeName}</a>`;
}
