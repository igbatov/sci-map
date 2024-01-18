
export enum ActionType {
  ParentID = 'parentID',
  Content = 'content',
  Name = 'name',
}

export type ChangeLog = {
  changeLogID: string;
  nodeID: string;
  userID: string;
  timestamp: number;
  action: ActionType;
  attributes: {
    value: any;
    valueBefore: any;
    valueAfter: any;
    added: any;
    removed: any;
  };
};

export type ChangeLogNodeContent = {
  changeLogID: string;

  timestamp: number;
  action: ActionType;

  userID: string;
  userDisplayName: string;

  nodeID: string;
  nodeIDPath: string;
  nodeName: string;

  newContent: string;
}

export type ChangeLogNodeName = {
  changeLogID: string;

  timestamp: number;
  action: ActionType;

  userID: string;
  userDisplayName: string;

  nodeID: string;
  nodeIDPath: string;
  nodeName: string;

  newName: string;
}

export type ChangeLogNodeParent = {
  changeLogID: string;

  timestamp: number;
  action: ActionType;

  userID: string;
  userDisplayName: string;

  parentNodeIDBefore: string;
  parentNodeIDBeforePath: string;
  parentNodeBeforeName: string;

  parentNodeIDAfter: string;
  parentNodeIDAfterPath: string;
  parentNodeAfterName: string;

  nodeID: string;
  nodeIDPath: string;
  nodeName: string;

  isRemoved: boolean;
  isAdded: boolean;
}

export type ChangeLogEnriched = ChangeLogNodeContent | ChangeLogNodeName | ChangeLogNodeParent;

