import { filterNodesAndLayers, findCurrentNode } from "@/views/Home.ts";
import {
  fillTreePositions,
  generateTreeSkeleton,
  skeletonToTree
} from "@/tools/utils";
import { treeToMapNodeLayers, treeToNodeRecord } from "@/tools/graphics";
import { MapNode, TreeSkeleton, Viewport } from "@/types/graphics";
import { ErrorKV } from "@/types/errorkv";

describe("filterNodesAndLayers", () => {
  const runTest = (
    treeSk: TreeSkeleton,
    rootWH: Viewport,
    viewport: Viewport
  ): [Array<Record<number, MapNode>>, ErrorKV] => {
    const tree = skeletonToTree(treeSk, true);
    fillTreePositions(tree, rootWH);
    let [layers, err] = treeToMapNodeLayers(tree);
    expect(layers).not.toBeNull();
    expect(err).toBeNull();
    const nodeRecord = treeToNodeRecord(tree);

    const [currNodeId, _] = findCurrentNode(
      layers!,
      nodeRecord,
      viewport,
      1,
      {x:0, y:0},
      {x:0, y:0}
    );

    return filterNodesAndLayers(layers!, nodeRecord, currNodeId);
  };

  it("works for two layers", () => {
    const treeSk = {
      id: '0',
      children: [{ id: '1' }, { id: '2' }]
    };
    const [layers, err] = runTest(
      treeSk,
      { width: 1000, height: 1000 },
      { width: 1000, height: 1000 }
    );
    expect(err).toBeNull();
    expect(layers).toEqual([
      {
        "0": {
          "border": [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 1000,
              "y": 0
            },
            {
              "x": 1000,
              "y": 1000
            },
            {
              "x": 0,
              "y": 1000
            }
          ],
          "center": {
            "x": 500,
            "y": 500
          },
          "id": "0",
          "title": ""
        }
      },
      {
        "1": {
          "border": [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 500,
              "y": 0
            },
            {
              "x": 500,
              "y": 1000
            },
            {
              "x": 0,
              "y": 1000
            }
          ],
          "center": {
            "x": 250,
            "y": 500
          },
          "id": "1",
          "title": "1"
        },
        "2": {
          "border": [
            {
              "x": 500,
              "y": 0
            },
            {
              "x": 1000,
              "y": 0
            },
            {
              "x": 1000,
              "y": 1000
            },
            {
              "x": 500,
              "y": 1000
            }
          ],
          "center": {
            "x": 750,
            "y": 500
          },
          "id": "2",
          "title": "2"
        }
      }
    ]);
  });

  it("works for 6 layers with zoom to top left node of third layer", () => {
    const treeSk = generateTreeSkeleton(6, 4);
    const [layers, err] = runTest(
      treeSk,
      { width: 4000, height: 4000 },
      { width: 1000, height: 1000 }
    );
    expect(err).toBeNull();
    expect(layers.length).toEqual(4);

    expect(Object.keys(layers[0]).length).toEqual(4);
    expect(Object.keys(layers[1]).length).toEqual(16);
    expect(Object.keys(layers[2]).length).toEqual(16);
    expect(Object.keys(layers[3]).length).toEqual(64);

    expect(Object.keys(layers[0])).toEqual(["5", "6", "7", "8"]);
    expect(Object.keys(layers[1])).toEqual([
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "32",
      "33",
      "34",
      "35",
      "36"
    ]);
  });
});

describe("findCurrentNode", () => {
  const runTest = (
    treeSk: TreeSkeleton,
    rootWH: Viewport,
    viewport: Viewport
  ): [string, ErrorKV] => {
    const tree = skeletonToTree(treeSk, false);
    fillTreePositions(tree, rootWH);
    let [layers, err] = treeToMapNodeLayers(tree);
    expect(layers).not.toBeNull();
    expect(err).toBeNull();
    const nodeRecord = treeToNodeRecord(tree);
    const [nodeId, err2] = findCurrentNode(layers!, nodeRecord, viewport, 1, {x:0, y:0}, {x:0, y:0});
    return [nodeId, err2];
  };

  it("works for two layers", () => {
    const treeSk = {
      id: '0',
      children: [{ id: '1' }, { id: '2' }]
    };
    const [nodeId, err] = runTest(
      treeSk,
      { width: 1000, height: 1000 },
      { width: 1000, height: 1000 }
    );
    expect(err).toBeNull();
    expect(nodeId).toEqual('0');
  });

  it("works for 3 layers two nodes on second and third", () => {
    const treeSk = {
      id: '0',
      children: [
        { id: '1', children: [{ id: '3' }, { id: '4' }] },
        { id: '2', children: [{ id: '5' }, { id: '6' }] }
      ]
    };
    const [nodeId, err] = runTest(
      treeSk,
      { width: 1000, height: 1000 },
      { width: 1000, height: 1000 }
    );
    expect(err).toBeNull();
    expect(nodeId).toEqual('0');
  });

  it("works for 3 layers 3 nodes on second", () => {
    const treeSk = {
      id: '0',
      children: [
        { id: '1', children: [{ id: '5' }, { id: '6' }] },
        { id: '2', children: [{ id: '7' }, { id: '8' }] },
        { id: '3', children: [{ id: '9' }, { id: '10' }] }
      ]
    };
    const [nodeId, err] = runTest(
      treeSk,
      { width: 1000, height: 1000 },
      { width: 1000, height: 1000 }
    );
    expect(err).toBeNull();
    expect(nodeId).toEqual('0');
  });
});
