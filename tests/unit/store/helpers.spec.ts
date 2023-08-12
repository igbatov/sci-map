import { getAllChildren } from "@/store/helpers";

describe("getAllChildren", () => {
  it("get all children recursively", () => {
    const tree = {
      id: "1",
      title: "root",
      position: {x: 100, y: 100},
      children: [
        {
          id: "2",
          title: "subroot_id2",
          position: {x: 100, y: 100},
          children: [
            {
              id: "4",
              title: "subsubroot_id4",
              position: {x: 100, y: 100},
              children: [],
            }
          ]
        },
        {
          id: "3",
          title: "subroot_id3",
          position: {x: 100, y: 100},
          children: []
        },
      ]
    };

    console.log(getAllChildren(tree))
  });
})
