import {
  getVoronoiCells,
  intersect,
  treeToMapNodeLayers,
  addVector,
  subtractVector,
  transferToPoint,
  getVectorIntersection,
  morphChildrenPoints,
  area,
  getVoronoiCellsInSquare,
  getMaxDiagonal, intersectPC, polygonAsArray
} from "../../src/tools/graphics";

describe("transferToPoint", () => {
  it("", () => {
    const a = { from: { x: 10, y: 10 }, to: { x: 15, y: 20 } };
    const b = transferToPoint(a, { x: 0, y: 0 });
    expect(b).toEqual({ from: { x: 0, y: 0 }, to: { x: 5, y: 10 } });
  });
});

describe("addVector", () => {
  it("", () => {
    const a = { from: { x: 10, y: 10 }, to: { x: 15, y: 20 } };
    const b = { from: { x: 0, y: 0 }, to: { x: 5, y: 3 } };
    const c1 = addVector(a, b);
    expect(c1).toEqual({ from: { x: 10, y: 10 }, to: { x: 20, y: 23 } });
    const c2 = addVector(b, a);
    expect(c2).toEqual({ from: { x: 0, y: 0 }, to: { x: 10, y: 13 } });
  });
});

describe("subtractVector", () => {
  it("", () => {
    const c = { from: { x: 10, y: 10 }, to: { x: 20, y: 23 } };
    const b = { from: { x: 0, y: 0 }, to: { x: 5, y: 3 } };
    const a = subtractVector(c, b);
    expect(addVector(transferToPoint(b, c.from), a)).toEqual(c);
    expect(a).toEqual({ from: { x: 15, y: 13 }, to: { x: 20, y: 23 } });
  });
});

describe("treeToMapNodeLayers", () => {
  it("", () => {
    const tree = {
      id: "0",
      title: "",
      position: { x: 500, y: 500 },
      wikipedia: "",
      resources: [],
      children: [
        {
          id: "1",
          title: "1",
          position: { x: 250, y: 500 },
          wikipedia: "",
          resources: [],
          children: [
            {
              id: "3",
              title: "3",
              position: { x: 500, y: 250 },
              wikipedia: "",
              resources: [],
              children: []
            },
            {
              id: "4",
              title: "4",
              position: { x: 500, y: 750 },
              wikipedia: "",
              resources: [],
              children: []
            }
          ]
        },
        {
          id: "2",
          title: "2",
          position: { x: 750, y: 500 },
          wikipedia: "",
          resources: [],
          children: [
            {
              id: "5",
              title: "5",
              position: { x: 500, y: 250 },
              wikipedia: "",
              resources: [],
              children: []
            },
            {
              id: "6",
              title: "6",
              position: { x: 500, y: 750 },
              wikipedia: "",
              resources: [],
              children: []
            }
          ]
        }
      ]
    };
    const exp = [
      {
        "0": {
          id: "0",
          border: [
            {
              x: 0,
              y: 0
            },
            {
              x: 1200,
              y: 0
            },
            {
              x: 1200,
              y: 800
            },
            {
              x: 0,
              y: 800
            }
          ],
          title: "",
          center: {
            x: 600,
            y: 400
          }
        }
      },
      {
        "1": {
          id: "1",
          title: "1",
          center: {
            x: 300.00000000000006,
            y: 400
          },
          border: [
            {
              x: 0,
              y: 0
            },
            {
              x: 600,
              y: 0
            },
            {
              x: 600,
              y: 800
            },
            {
              x: 0,
              y: 800
            }
          ]
        },
        "2": {
          id: "2",
          title: "2",
          center: {
            x: 900,
            y: 400
          },
          border: [
            {
              x: 600,
              y: 0
            },
            {
              x: 1200,
              y: 0
            },
            {
              x: 1200,
              y: 800
            },
            {
              x: 600,
              y: 800
            }
          ]
        }
      },
      {
        "3": {
          id: "3",
          title: "3",
          center: {
            x: 300,
            y: 200
          },
          border: [
            {
              x: 0,
              y: 0
            },
            {
              x: 600,
              y: 0
            },
            {
              x: 600,
              y: 400
            },
            {
              x: 0,
              y: 400
            }
          ]
        },
        "4": {
          id: "4",
          title: "4",
          center: {
            x: 300,
            y: 600
          },
          border: [
            {
              x: 0,
              y: 400
            },
            {
              x: 600,
              y: 400
            },
            {
              x: 600,
              y: 800
            },
            {
              x: 0,
              y: 800
            }
          ]
        },
        "5": {
          id: "5",
          title: "5",
          center: {
            x: 900,
            y: 200
          },
          border: [
            {
              x: 600,
              y: 0
            },
            {
              x: 1200,
              y: 0
            },
            {
              x: 1200,
              y: 400
            },
            {
              x: 600,
              y: 400
            }
          ]
        },
        "6": {
          id: "6",
          title: "6",
          center: {
            x: 900,
            y: 600
          },
          border: [
            {
              x: 600,
              y: 400
            },
            {
              x: 1200,
              y: 400
            },
            {
              x: 1200,
              y: 800
            },
            {
              x: 600,
              y: 800
            }
          ]
        }
      }
    ];

    const [res, err] = treeToMapNodeLayers(
      tree,
      [
        {
          x: 0,
          y: 0
        },
        {
          x: 1200,
          y: 0
        },
        {
          x: 1200,
          y: 800
        },
        {
          x: 0,
          y: 800
        }
      ],
      { x: 600, y: 400 }
    );

    expect(err).toEqual(null);
    expect(res).toEqual(exp);
  });
});

describe("getVoronoiCellsInSquare", () => {
  it("1", () => {
    const square = {
      leftBottom: { x: 288, y: 94 },
      rightTop: { x: 360, y: 188 }
    };
    const centers = [
      { x: 324, y: 103.4 },
      { x: 324, y: 122.2 },
      { x: 324, y: 141 },
      { x: 324, y: 159.8 },
      { x: 324, y: 178.60000000000002 }
    ];
    const cells = getVoronoiCellsInSquare(
      centers,
      square.leftBottom,
      square.rightTop
    );
  });

  it("2", () => {
    const square = {
      leftBottom: { x: 0, y: 0 },
      rightTop: { x: 1440, y: 376 }
    };
    const centers = [
      { x: 144, y: 188 },
      { x: 432, y: 188 },
      { x: 720, y: 188 },
      { x: 1008, y: 188 },
      { x: 1296, y: 188 }
    ];
    const cells = getVoronoiCellsInSquare(
      centers,
      square.leftBottom,
      square.rightTop
    );
  });

  it("weird results", () => {
    const square = {
      leftBottom: { x: 768, y: 0 },
      rightTop: { x: 864, y: 160 }
    };
    const centers = [
      { x: 816, y: 16 },
      { x: 816, y: 48 },
      { x: 816, y: 80 },
      { x: 816, y: 112 },
      { x: 816, y: 144 }
    ];
    const cells = getVoronoiCellsInSquare(
      centers,
      square.leftBottom,
      square.rightTop
    );
  });
});
describe("getVoronoiCells", () => {
  it("1", () => {
    const outerBorder = [
      { x: 768, y: 0 },
      { x: 864, y: 0 },
      { x: 864, y: 160 },
      { x: 768, y: 160 }
    ];
    const centers = [
      { x: 816, y: 16 },
      { x: 816, y: 48 },
      { x: 816, y: 80 },
      { x: 816, y: 112 },
      { x: 816, y: 144 }
    ];
    const [cells] = getVoronoiCells(outerBorder, centers);
  });

  it("return VoronoiCells with each center in the cell", () => {
    const [cells, error] = getVoronoiCells(
      [
        { x: 0, y: -100 },
        { x: -100, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 0 }
      ],
      [
        { x: 0, y: -50 },
        { x: -50, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 50, y: 0 }
      ]
    );

    expect(error).toEqual(null);
    expect(cells).toEqual([
      {
        border: [
          { x: -50, y: -50 },
          { x: 0, y: -100 },
          { x: 50, y: -50 },
          { x: 25, y: -25 },
          {
            x: -25,
            y: -25
          }
        ],
        center: { x: 0, y: -50 }
      },
      {
        border: [
          { x: -100, y: 0 },
          { x: -50, y: -50 },
          { x: -25, y: -25 },
          {
            x: -25,
            y: 25
          },
          { x: -50, y: 50 }
        ],
        center: { x: -50, y: 0 }
      },
      {
        border: [
          { x: -25, y: -25 },
          { x: 25, y: -25 },
          { x: 25, y: 25 },
          { x: -25, y: 25 }
        ],
        center: { x: 0, y: 0 }
      },
      {
        border: [
          { x: -50, y: 50 },
          { x: -25, y: 25 },
          { x: 25, y: 25 },
          { x: 50, y: 50 },
          {
            x: 0,
            y: 100
          }
        ],
        center: { x: 0, y: 50 }
      },
      {
        border: [
          { x: 25, y: -25 },
          { x: 50, y: -50 },
          { x: 100, y: 0 },
          { x: 50, y: 50 },
          {
            x: 25,
            y: 25
          }
        ],
        center: { x: 50, y: 0 }
      }
    ]);
  });
});

describe("getVectorIntersection", () => {
  it("returns null if vectors are parallel", () => {
    const p = getVectorIntersection(
      { from: { x: 0, y: 0 }, to: { x: 10, y: 10 } },
      { from: { x: -10, y: 0 }, to: { x: 0, y: 10 } }
    );
    expect(p).toBeNull();
  });

  it("returns null if vectors are not intersect", () => {
    const p = getVectorIntersection(
      { from: { x: 0, y: 0 }, to: { x: 10, y: 10 } },
      { from: { x: 0, y: -5 }, to: { x: -5, y: 0 } }
    );
    expect(p).toBeNull();
  });

  it("returns intersection even if it is only by border", () => {
    const p = getVectorIntersection(
      { from: { x: 0, y: 0 }, to: { x: 10, y: 10 } },
      { from: { x: 0, y: 0 }, to: { x: 5, y: -5 } }
    );
    expect(p).toEqual({ x: 0, y: 0 });
  });

  it("returns intersection", () => {
    const p = getVectorIntersection(
      { from: { x: -10, y: -10 }, to: { x: 10, y: 10 } },
      { from: { x: -5, y: 5 }, to: { x: 5, y: -5 } }
    );
    expect(p).toEqual({ x: 0, y: 0 });
  });
});

describe("getMaxDiagonal", () => {
  it("works for square", () => {
    const [v] = getMaxDiagonal([
      { x: 100, y: 100 },
      { x: 100, y: 200 },
      { x: 200, y: 200 },
      { x: 200, y: 100 }
    ]);
    expect(v).toEqual({ from: { x: 100, y: 100 }, to: { x: 200, y: 200 } });
  });
  it("works for triangle", () => {
    const [v] = getMaxDiagonal([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 }
    ]);
    expect(v).toEqual({ from: { x: 100, y: 0 }, to: { x: 0, y: 50 } });
  });
});

describe("morphChildrenPoints", () => {
  it("return scaled children for square cell", () => {
    const oldBorder = [
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 50, y: 50 },
      { x: 50, y: 0 }
    ];
    const oldPoints = {
      1: { x: 25, y: 25 },
      2: { x: 10, y: 25 },
      3: { x: 35, y: 35 }
    };
    const newBorder = [
      { x: -100, y: -100 },
      { x: -100, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: -100 }
    ];
    const [newPoints, err] = morphChildrenPoints(
      oldBorder,
      newBorder,
      oldPoints
    );
    expect(err).toBeNull();
    expect(newPoints).toEqual({
      "1": { x: 0, y: 0 },
      "2": { x: -60, y: 0 },
      "3": { x: 40, y: 40 }
    });
  });
});

describe("area", () => {
  it("works for square counterclockwise", () => {
    const a = area([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 0 }
    ]);

    expect(a).toEqual(10000);
  });
  it("works for square clockwise", () => {
    const a = area(
      [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 0 }
      ].reverse()
    );

    expect(a).toEqual(10000);
  });
  it("works for triangle", () => {
    const a = area([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 }
    ]);

    expect(a).toEqual(10000 / 2);
  });
});
