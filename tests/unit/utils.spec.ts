import {
  fillTreePositions,
  generateTreeSkeleton, mod,
  skeletonToTree
} from "@/tools/utils";
describe("skeletonToTree", () => {
  it("", () => {
    const treeSkeleton = {
      id: "0",
      children: [
        {
          id: "1"
        },
        {
          id: "2"
        }
      ]
    };
    const tree = skeletonToTree(treeSkeleton, false);
    expect(tree).toEqual({
      id: "0",
      title: "",
      position: {
        x: 0,
        y: 0
      },
      wikipedia: "",
      resources: [],
      children: [
        {
          id: "1",
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
          id: "2",
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
      id: "0",
      children: [
        {
          id: "1"
        },
        {
          id: "2"
        }
      ]
    };

    const tree = skeletonToTree(treeSk, false);
    fillTreePositions(tree, { width: 1000, height: 1000 });
    expect(tree).toEqual({
      id: "0",
      title: "",
      position: {
        x: 500,
        y: 500
      },
      wikipedia: "",
      resources: [],
      children: [
        {
          id: "1",
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
          id: "2",
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
  it("correctly works for negative numbers", () => {
    expect(mod(-1, 8)).toEqual(7)
  })
  it("correctly works for edge case numbers", () => {
    expect(mod(8, 8)).toEqual(0)
  })
  it("correctly works for positive numbers", () => {
    expect(mod(10, 8)).toEqual(2)
  })
})

describe("generateTreeSkeleton", () => {
  it("", () => {
    const treeSk = generateTreeSkeleton(3, 2);
    treeSk.children?.map(
      (ch, index) =>
        (treeSk.children![index].children = treeSk.children![
          index
        ].children!.sort((a, b) => (a.id < b.id ? -1 : 1)))
    );
    treeSk.children = treeSk.children?.sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(treeSk).toEqual({
      id: "0",
      children: [
        {
          id: "1",
          children: [
            {
              id: "3"
            },
            {
              id: "4"
            }
          ]
        },
        {
          id: "2",
          children: [
            {
              id: "5"
            },
            {
              id: "6"
            }
          ]
        }
      ]
    });
  });
});
