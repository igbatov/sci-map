import { getVoronoiCells, intersect, mapToLayers } from "@/tools/graphics";

describe("mapToLayers", () => {
  it("", () => {
    const tree = {
      id: 0,
      title: "",
      position: { x: 600, y: 400 },
      wikipedia: "",
      resources: [],
      children: [
        {
          id: 1,
          title: "1",
          position: { x: 150, y: 400 },
          wikipedia: "",
          resources: [],
          children: [
            {
              id: 3,
              title: "3",
              position: { x: 150, y: 100 },
              wikipedia: "",
              resources: [],
              children: []
            },
            {
              id: 4,
              title: "4",
              position: { x: 150, y: 300 },
              wikipedia: "",
              resources: [],
              children: []
            }
          ]
        },
        {
          id: 2,
          title: "2",
          position: { x: 450, y: 400 },
          wikipedia: "",
          resources: [],
          children: [
            {
              id: 5,
              title: "5",
              position: { x: 450, y: 100 },
              wikipedia: "",
              resources: [],
              children: []
            },
            {
              id: 6,
              title: "6",
              position: { x: 450, y: 300 },
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
          id: 0,
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
          id: 1,
          title: "1",
          center: {
            x: 150,
            y: 400
          },
          border: [
            {
              x: 0,
              y: 0
            },
            {
              x: 300,
              y: 0
            },
            {
              x: 300,
              y: 800
            },
            {
              x: 0,
              y: 800
            }
          ]
        },
        "2": {
          id: 2,
          title: "2",
          center: {
            x: 450,
            y: 400
          },
          border: [
            {
              x: 300,
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
              x: 300,
              y: 800
            }
          ]
        }
      },
      {
        "3": {
          id: 3,
          title: "3",
          center: {
            x: 150,
            y: 100
          },
          border: [
            {
              x: 0,
              y: 0
            },
            {
              x: 300,
              y: 0
            },
            {
              x: 300,
              y: 200
            },
            {
              x: 0,
              y: 200
            }
          ]
        },
        "4": {
          id: 4,
          title: "4",
          center: {
            x: 150,
            y: 300
          },
          border: [
            {
              x: 0,
              y: 200
            },
            {
              x: 300,
              y: 200
            },
            {
              x: 300,
              y: 800
            },
            {
              x: 0,
              y: 800
            }
          ]
        },
        "5": {
          id: 5,
          title: "5",
          center: {
            x: 450,
            y: 100
          },
          border: [
            {
              x: 300,
              y: 0
            },
            {
              x: 1200,
              y: 0
            },
            {
              x: 1200,
              y: 200
            },
            {
              x: 300,
              y: 200
            }
          ]
        },
        "6": {
          id: 6,
          title: "6",
          center: {
            x: 450,
            y: 300
          },
          border: [
            {
              x: 300,
              y: 200
            },
            {
              x: 1200,
              y: 200
            },
            {
              x: 1200,
              y: 800
            },
            {
              x: 300,
              y: 800
            }
          ]
        }
      }
    ];

    const [res, err] = mapToLayers(tree);

    expect(err).toEqual(null);
    expect(res).toEqual(exp);
  });
});

describe("getVoronoiCells", () => {
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

describe("intersect", () => {
  it("return Polygon", () => {
    const is = intersect(
      [
        { x: 100, y: -100 },
        { x: 25, y: -25 },
        { x: -25, y: -25 },
        { x: -100, y: -100 }
      ],
      [
        { x: 0, y: -100 },
        { x: -100, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 0 }
      ]
    );

    expect(is).toEqual([
      [
        { x: -50, y: -50 },
        { x: 0, y: -100 },
        { x: 50, y: -50 },
        { x: 25, y: -25 },
        { x: -25, y: -25 }
      ]
    ]);
  });

  it("return Polygon that is fully contains inside second one", () => {
    const is = intersect(
      [
        { x: 0, y: -100 },
        { x: -100, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 0 }
      ],
      [
        { x: 0, y: -50 },
        { x: -50, y: 0 },
        { x: 0, y: 50 },
        { x: 50, y: 0 }
      ]
    );

    expect(is).toHaveLength(1);
    expect(is[0]).toHaveLength(4);
    expect(is[0]).toContainEqual({ x: 0, y: -50 });
    expect(is[0]).toContainEqual({ x: -50, y: 0 });
    expect(is[0]).toContainEqual({ x: 0, y: 50 });
    expect(is[0]).toContainEqual({ x: 50, y: 0 });
  });
});
