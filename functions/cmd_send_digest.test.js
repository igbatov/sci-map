const { getDigest } = require('./cmd_send_digest');
const {ActionType} = require("./actions");

class ChangeLog {
  constructor(id, data) {
    this.id = id;
    this.d = data
  }

  // Method
  data() {
    return this.d
  }
}

getDigest(
  /**
   * Period last change
   * @param nodeID
   * @param actionType
   * @returns {ChangeLog|void}
   */
  (nodeID, actionType) => {
    switch (actionType)
    {
      case ActionType.Name:
        return new ChangeLog('key_name_0', {
          attributes: {
            value: 'name B'
          }
        })
      case ActionType.Content:
        return new ChangeLog('key_content_0', {
          attributes: {
            value: 'content B'
          }
        });
      case ActionType.ParentID:
        return new ChangeLog('key_parent_id_0', {
          attributes: {
            valueAfter: 'parent_id_b'
          }
        });
        case ActionType.Children:
        return new ChangeLog('key_children_0', {
          attributes: {
            valueAfter: ['1', '4', '5']
          }
        });
        case ActionType.Precondition:
        return new ChangeLog('key_precondition_0', {
          attributes: {
            valueAfter: ['10', '40', '50', '60']
          }
        });
        case ActionType.Remove:
        return new ChangeLog('key_remove_0', {});

      default:
        alert('Default case');
    }
    return alert('Unknown action type');
  },

  /**
   * Previous period last change
   * @param nodeID
   * @param actionType
   * @returns {ChangeLog|void}
   */
  (nodeID, actionType) => {
    switch (actionType)
    {
      case ActionType.Name:
        return new ChangeLog('key_name_-1', {
          attributes: {
            value: 'name A'
          }
        })
      case ActionType.Content:
        return new ChangeLog('key_content_-1', {
          attributes: {
            value: 'content A'
          }
        });
      case ActionType.ParentID:
        return new ChangeLog('key_parent_id_-1', {
          attributes: {
            valueAfter: 'parent_id_b'
          }
        });
      case ActionType.Children:
        return new ChangeLog('key_children_-1', {
          attributes: {
            valueAfter: ['1', '2', '3']
          }
        });
      case ActionType.Precondition:
        return new ChangeLog('key_precondition_-1', {
          attributes: {
            valueAfter: ['10', '20', '30', '40']
          }
        });
      case ActionType.Remove:
        return null;

      default:
        alert('Default case');
    }
    return alert('Unknown action type');
  },
  (nodeID) => {
    switch (nodeID)
    {
      case '1':
        return ['some title 1', false];
      case 'parent_id_b':
        return ['some title parent_id_b', false]
    }
    return alert('Unknown nodeID');
  },
  '1',
  '1',
).then((text) => {
  console.log(text)
})


