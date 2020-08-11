import { getGrid } from "./utils";

export class TreeItem {
  constructor({ id, title, parent, children }) {
    this.id = id;
    this.title = title;
    this.parent = parent;
    this.children = children;
  }

  IsLastChild(id) {
    return (
      this.children &&
      this.children.length &&
      this.children[this.children.length - 1] === id
    );
  }

  GetWH() {
    return this.parent.GetChildrenWH(this.id);
  }

  GetXY() {
    return this.parent.GetChildrenXY(this.id);
  }

  GetAbsoluteXY() {
    const parentAbsXY = this.parent.GetAbsoluteXY();
    const xy = this.GetXY();
    return {
      x: parentAbsXY.x + xy.x,
      y: parentAbsXY.y + xy.y
    };
  }

  GetLevel() {
    return this.parent.GetLevel() + 1;
  }

  GetChildrenWH(id) {
    const wh = this.GetWH();
    const width = wh.width;
    const height = wh.height;
    const childrenLength = this.children.length;
    let grid = getGrid(childrenLength, width, height);
    let childWidth = width / grid.rowNum;
    // if this is last index, stretch children till end of raw
    if (childrenLength % grid.rowNum !== 0 && this.IsLastChild(id)) {
      childWidth =
        childWidth * (1 + grid.rowNum - (childrenLength % grid.rowNum));
    }
    const childHeight = height / grid.colNum;
    return {
      width: childWidth,
      height: childHeight
    };
  }

  GetChildrenXY(id) {
    const wh = this.GetWH();
    let grid = getGrid(this.children.length, wh.width, wh.height);
    const childWH = this.GetChildrenWH(this.children[0]);
    const index = this.children.indexOf(id);
    return {
      x: (index % grid.rowNum) * childWH.width,
      y: Math.floor(index / grid.rowNum) * childWH.height
    };
  }
}

export class RootTreeItem extends TreeItem {
  constructor({ id, title, parent, children, width, height, x, y }) {
    super({ id, title, parent, children });
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
  }

  GetWH() {
    return {
      width: this.width,
      height: this.height
    };
  }

  GetXY() {
    return {
      x: this.x,
      y: this.y
    };
  }

  GetAbsoluteXY() {
    return {
      x: this.x,
      y: this.y
    };
  }

  GetLevel() {
    return 0;
  }

  SetXY({ x, y }) {
    this.x = x;
    this.y = y;
  }

  SetWH({ width, height }) {
    this.width = width;
    this.height = height;
  }

  GetChildrenWH() {
    const wh = this.GetWH();
    const width = wh.width;
    const height = wh.height;
    const childrenLength = this.children.length;
    return {
      width: width/childrenLength,
      height: height
    };
  }

  GetChildrenXY(id) {
    const childWH = this.GetChildrenWH(this.children[0]);
    const index = this.children.indexOf(id);
    return {
      x: Math.floor(index) * childWH.width,
      y: 0
    };
  }
}
