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

  it("special for case when edge is longer than every diagonal", () => {
    const tree = {
      id: "1",
      title: "root",
      position: { x: 965, y: 130 },
      wikipedia: "",
      resources: [],
      children: [
        {
          id: "2",
          title: "zzz",
          position: { x: 1102, y: 108 },
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
          title: "virus",
          center: { x: 965, y: 130 },
          border: [
            { x: 704, y: 87 },
            { x: 1239, y: 87 },
            { x: 1148, y: 268 },
            { x: 768, y: 244 }
          ]
        }
      },
      {
        "2": {
          id: "2",
          title: "zzz",
          center: { x: 1102, y: 108 },
          border: [
            { x: 704, y: 87 },
            { x: 1239, y: 87 },
            { x: 1148, y: 268 },
            { x: 768, y: 244 }
          ]
        }
      }
    ] as Array<Record<string, MapNode>>;

    const [newCenter, changedNode, err] = getNewNodeCenter(tree, mapNodeLayers);
    expect(err).toBeNull();
    expect(newCenter).toEqual({ x: 885.75, y: 204.75 });
    expect(changedNode!.id).toEqual("2");
    expect(changedNode!.position).toEqual({ x: 1121.25, y: 126.25 });
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
