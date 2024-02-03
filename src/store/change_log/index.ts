export enum ActionType {
  ParentID = "parentID",
  Precondition = "precondition",
  Content = "content",
  Name = "name"
}

export type Node = {
  id: string;
  idPath: string;
  name: string;
};

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

export type ChangeLogNodePrecondition = {
  changeLogID: string;

  timestamp: number;
  action: ActionType;

  userID: string;
  userDisplayName: string;

  removed: Array<Node>;
  added: Array<Node>;
};

export type ChangeLogNodeContent = {
  changeLogID: string;

  timestamp: number;
  action: ActionType;

  userID: string;
  userDisplayName: string;

  node: Node;

  newContent: string;
};

export type ChangeLogNodeName = {
  changeLogID: string;

  timestamp: number;
  action: ActionType;

  userID: string;
  userDisplayName: string;

  node: Node;

  newName: string;
};

export type ChangeLogNodeParent = {
  changeLogID: string;

  timestamp: number;
  action: ActionType;

  userID: string;
  userDisplayName: string;

  parentNodeBefore: Node;
  parentNodeAfter: Node;
  node: Node;

  isRemoved: boolean;
  isAdded: boolean;
};

export type ChangeLogEnriched =
  | ChangeLogNodeContent
  | ChangeLogNodeName
  | ChangeLogNodePrecondition
  | ChangeLogNodeParent;
