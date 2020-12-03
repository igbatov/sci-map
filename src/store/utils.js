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

export const sleep = async m => new Promise(r => setTimeout(r, m));
