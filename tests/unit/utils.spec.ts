import {
  fillTreePositions,
  generateTreeSkeleton,
  skeletonToTree
} from "@/tools/utils";
describe("skeletonToTree", () => {
  it("", () => {
    const treeSkeleton = {
      id: 0,
      children: [
        {
          id: 1
        },
        {
          id: 2
        }
      ]
    };
    const tree = skeletonToTree(treeSkeleton, false);
    expect(tree).toEqual({
      id: 0,
      title: "",
      position: {
        x: 0,
        y: 0
      },
      wikipedia: "",
      resources: [],
      children: [
        {
          id: 1,
          title: "",
          position: {
            x: 0,
            y: 0
          },
          wikipedia: "",
          resources: [],
          children: []
        },
        {
          id: 2,
          title: "",
          position: {
            x: 0,
            y: 0
          },
          wikipedia: "",
          resources: [],
          children: []
        }
      ]
    });
  });
});

describe("fillTreePositions", () => {
  it("", () => {
    const treeSk = {
      id: 0,
      children: [
        {
          id: 1
        },
        {
          id: 2
        }
      ]
    };

    const tree = skeletonToTree(treeSk, false);
    fillTreePositions(tree, { width: 1000, height: 1000 });
    expect(tree).toEqual({
      id: 0,
      title: "",
      position: {
        x: 500,
        y: 500
      },
      wikipedia: "",
      resources: [],
      children: [
        {
          id: 1,
          title: "",
          position: {
            x: 250,
            y: 500
          },
          wikipedia: "",
          resources: [],
          children: []
        },
        {
          id: 2,
          title: "",
          position: {
            x: 750,
            y: 500
          },
          wikipedia: "",
          resources: [],
          children: []
        }
      ]
    });
  });
});

describe("generateTreeSkeleton", () => {
  it("", () => {
    const treeSk = generateTreeSkeleton(3, 2);
    expect(treeSk).toEqual({
      id: 0,
      children: [
        {
          id: 1,
          children: [
            {
              id: 5
            },
            {
              id: 6
            }
          ]
        },
        {
          id: 2,
          children: [
            {
              id: 3
            },
            {
              id: 4
            }
          ]
        }
      ]
    });
  });
});
