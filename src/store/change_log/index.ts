export enum ActionType {
  /**
   * /map
   */
  Name = "name",
  ParentID = "parentID",

  /**
   * /node_content
   */
  Content = "content",

  /**
   * /precondition
   */
  Precondition = "precondition",

  /**
   * /cmd/remove
   */
  Remove = "remove",

  /**
   * /cmd/restore
   */
  Restore = "restore"
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
    parentNodeID: any;
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

  oldContent: string | null;
  newContent: string;
};

export type ChangeLogNodeName = {
  changeLogID: string;

  timestamp: number;
  action: ActionType;

  userID: string;
  userDisplayName: string;

  node: Node;

  oldName: string | null;
  newName: string;
};

export type ChangeLogNodeParent = {
  changeLogID: string;

  timestamp: number;
  action: ActionType;

  userID: string;
  userDisplayName: string;

  parentNodeBefore: Node | null;
  parentNodeAfter: Node | null;
  node: Node;

  isRemoved: boolean;
  isAdded: boolean;
};

export type ChangeLogEnriched =
  | ChangeLogNodeContent
  | ChangeLogNodeName
  | ChangeLogNodePrecondition
  | ChangeLogNodeParent;
