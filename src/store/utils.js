export const fixSingleChild = tree => {
  let stack = [];
  stack.push(tree.root);
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.children && node.children.length === 1) {
      node.children.push({
        id: -node.children[0].id,
        title: "",
        children: []
      });
    }
    node.children.forEach(child => {
      stack.push(child);
    });
  }

  return tree;
};

export const treeToHash = tree => {
  let hash = {};
  let stack = [];
  stack.push(tree.root);
  while (stack.length > 0) {
    const node = stack.pop();
    hash[node.id] = node;
    node.children.forEach(child => {
      stack.push(child);
    });
  }

  return hash;
};

export const getGrid = (itemsNum, width, height) => {
  let rowLength = itemsNum;
  if (rowLength < 2) {
    return {
      rowNum: 1,
      colNum: 1
    };
  }
  let colLength = 1;
  let parentWidth = width;
  let parentHeight = height;

  let itemHeight = parentHeight / colLength;
  let itemWidth = parentWidth / rowLength;
  while (itemHeight / itemWidth > 1) {
    colLength++;
    rowLength = Math.ceil(itemsNum / colLength);
    itemHeight = parentHeight / colLength;
    itemWidth = parentWidth / rowLength;
  }

  // make sure number of rows is even number (for better parent title visibility)
  if (colLength % 2 !== 0) {
    if (rowLength === 1) {
      if (colLength === 1) {
        console.error("Node must have at least 2 children!");
      } else {
        colLength--;
        rowLength = Math.ceil(itemsNum / colLength);
      }
    } else {
      colLength++;
      rowLength = Math.ceil(itemsNum / colLength);
    }
  }

  return {
    rowNum: rowLength,
    colNum: colLength
  };
};

export const sleep = async m => new Promise(r => setTimeout(r, m));
