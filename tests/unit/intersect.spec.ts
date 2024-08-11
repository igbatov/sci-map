import {
    intersect,
    intersectPolybool,
    intersectPC
  } from "../../src/tools/graphics";

describe("intersect", () => {
    it("crazy case for martinez-polygon-clipping", () => {
      const [is, err] = intersectPolybool(
        [
          {
            "x": 1040.2186425178609,
            "y": 59.21651540636367
          },
          {
            "x": 1063.9932357618593,
            "y": 54.805556385249645
          },
          {
            "x": 1063.9932357618593,
            "y": 20.509062784352313
          },
          {
            "x": 1040.2186425178609,
            "y": 20.509062784352313
          }
        ],
        [
          {
            "x": 1040.2186425178609,
            "y": 86.45164340162916
          },
          {
            "x": 1042.3019742068636,
            "y": 20.509062784352313
          },
          {
            "x": 1055.2553337023883,
            "y": 24.725651161801736
          },
          {
            "x": 1063.9932357618593,
            "y": 82.33586646835008
          }
        ]
      );
  
      expect(err).toEqual(null);
      expect(is!.length).toEqual(1);
      expect(is![0]).toHaveLength(4);
    });
  
    it("returns Polygon", () => {
      const [is, err] = intersectPolybool(
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
          ],
      );
  
      expect(err).toEqual(null);
      expect(is!.length).toEqual(1);
      expect(is![0]).toHaveLength(5);
      expect(is![0]).toContainEqual({ x: -50, y: -50 });
      expect(is![0]).toContainEqual({ x: 0, y: -100 });
      expect(is![0]).toContainEqual({ x: 50, y: -50 });
      expect(is![0]).toContainEqual({ x: 25, y: -25 });
      expect(is![0]).toContainEqual({ x: -25, y: -25 });
    });
  
    it("returns [] is there is no intersection", () => {
      const [is, err] = intersectPolybool(
        [
          { x: 0, y: 0 },
          { x: 0, y: 10 },
          { x: 10, y: 10 },
          { x: 10, y: 0 }
        ],
        [
          { x: 20, y: 0 },
          { x: 20, y: 10 },
          { x: 30, y: 10 },
          { x: 30, y: 0 }
        ]
      );
  
      expect(err).toBeNull();
      expect(is).toHaveLength(0);
    });
  
    it("returns Polygon that is fully contains inside second one", () => {
      const [is, err] = intersectPolybool(

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
          ],
 
      );
  
      expect(err).toBeNull();
      expect(is).toHaveLength(1);
      expect(is![0]).toHaveLength(4);
      expect(is![0]).toContainEqual({ x: 0, y: -50 });
      expect(is![0]).toContainEqual({ x: -50, y: 0 });
      expect(is![0]).toContainEqual({ x: 0, y: 50 });
      expect(is![0]).toContainEqual({ x: 50, y: 0 });
    });
  
    it("correctly works with fractions", () => {
      const [is, err] = intersectPolybool(
        [
          {
            "x": 555.5880681818181,
            "y": 411.6397305
          },
          {
            "x": 622.2570087645323,
            "y": 411.6397305
          },
          {
            "x": 613.6320801361145,
            "y": 407.35409111429584
          },
          {
            "x": 555.5880681818181,
            "y": 390.7412199796843
          }
        ],
        [
          {
            "x": 555.5880681818181,
            "y": 411.4417613636364
          },
          {
            "x": 570,
            "y": 361
          },
          {
            "x": 574,
            "y": 356
          },
          {
            "x": 629.064353665361,
            "y": 403.7224398433128
          },
          {
            "x": 620,
            "y": 473
          }
        ]
      );
  
      expect(err).toBeNull();
      expect(is).toHaveLength(1);
      expect(is![0]).toHaveLength(5);
      expect(is![0]).toContainEqual({
        "x": 622.2570087645323,
        "y": 411.6397305
      });
    });
  
    it("returns Polygon that is fully contains inside second one even for abnormally big numbers", () => {
      const [is, err] = intersectPolybool(
        [
          { x: 0, y: -Math.pow(Number.MAX_SAFE_INTEGER, 10) },
          { x: -Math.pow(Number.MAX_SAFE_INTEGER, 10), y: 0 },
          { x: 0, y: Math.pow(Number.MAX_SAFE_INTEGER, 10) },
          { x: Math.pow(Number.MAX_SAFE_INTEGER, 10), y: 0 }
        ],
        [
          { x: 0, y: -50 },
          { x: -50, y: 0 },
          { x: 0, y: 50 },
          { x: 50, y: 0 }
        ]
      );
  
      expect(err).toBeNull();
      expect(is).toHaveLength(1);
      expect(is![0]).toHaveLength(4);
      expect(is![0]).toContainEqual({ x: 0, y: -50 });
      expect(is![0]).toContainEqual({ x: -50, y: 0 });
      expect(is![0]).toContainEqual({ x: 0, y: 50 });
      expect(is![0]).toContainEqual({ x: 50, y: 0 });
    });
  });