export type ChangeLog = {
  nodeID: string;
  userID: string;
  timestamp: bigint;
  action: string;
  attributes: {
    value: any;
    valueBefore: any;
    valueAfter: any;
    added: any;
    removed: any;
  };
};
