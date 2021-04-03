import { getNewNodeCenter } from "@/store/tree/helpers";
import { MapNode } from "@/types/graphics";

describe("getNewNodeCenter", () => {
  it("for parent with no children returns newCenter on the center of max vector from parent center to its border", () => {
    const tree = {
      id: "1",
      title: "root",
      position: { x: 100, y: 100 },
      wikipedia: "",
      resources: [],
      children: []
    };

    const mapNodeLayers = [
      {
        "1": {
          id: "1",
          title: "root",
          center: { x: 100, y: 100 },
          border: [
            { x: 0, y: 0 },
            { x: 0, y: 200 },
            { x: 200, y: 200 },
            { x: 200, y: 0 }
          ]
        }
      }
    ] as Array<Record<string, MapNode>>;

    const [newNodeCenter, oldNode, err] = getNewNodeCenter(tree, mapNodeLayers);
    expect(newNodeCenter).toEqual({ x: 50, y: 50 });
    expect(oldNode).toBeNull();
    expect(err).toBeNull();
  });

  it("for parent with children returns newCenter on the diagonal of node with maximal diagonal", () => {
    const tree = {
      id: "1",
      title: "root",
      position: { x: 100, y: 100 },
      wikipedia: "",
      resources: [],
      children: [
        {
          id: "2",
          title: "child_id2",
          position: { x: 50, y: 100 },
          wikipedia: "",
          resources: [],
          children: []
        },
        {
          id: "3",
          title: "child_id3",
          position: { x: 150, y: 100 },
          wikipedia: "",
          resources: [],
          children: []
        }
      ]
    };

    const mapNodeLayers = [
      {
        "1": {
          id: "1",
          title: "root",
          center: { x: 100, y: 100 },
          border: [
            { x: 0, y: 0 },
            { x: 0, y: 200 },
            { x: 200, y: 200 },
            { x: 200, y: 0 }
          ]
        }
      },
      {
        "2": {
          id: "2",
          title: "child_id2",
          center: { x: 50, y: 100 },
          border: [
            { x: 0, y: 0 },
            { x: 0, y: 200 },
            { x: 100, y: 200 },
            { x: 100, y: 0 }
          ]
        },
        "3": {
          id: "3",
          title: "child_id3",
          center: { x: 150, y: 100 },
          border: [
            { x: 100, y: 0 },
            { x: 100, y: 200 },
            { x: 200, y: 200 },
            { x: 200, y: 0 }
          ]
        }
      }
    ] as Array<Record<string, MapNode>>;
    const [newNodeCenter, oldNode, err] = getNewNodeCenter(tree, mapNodeLayers);
    expect(newNodeCenter).toEqual({ x: 75, y: 150 });
    expect(oldNode!).toEqual({
      id: "2",
      title: "child_id2",
      position: { x: 25, y: 50 },
      wikipedia: "",
      resources: [],
      children: []
    });
    expect(err).toBeNull();
  });
});
