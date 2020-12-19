import { getVoronoiCells, intersect } from "@/tools/graphics";

describe("getVoronoiCells", () => {
    it("return VoronoiCells with each center in the cell", () => {
        const [cells, error] = getVoronoiCells(
            [
                {x: 0, y: -100},
                {x: -100, y: 0},
                {x: 0, y: 100},
                {x: 100, y: 0},
            ],
            [
                {x:0, y:-50},
                {x:-50, y:0},
                {x:0, y:0},
                {x:0, y:50},
                {x:50, y:0},
            ],
        )

        expect(error).toEqual(null)
        expect(cells).toEqual(
            [{
                "border": [{"x": -50, "y": -50}, {"x": 0, "y": -100}, {"x": 50, "y": -50}, {"x": 25, "y": -25}, {
                    "x": -25,
                    "y": -25
                }], "center": {"x": 0, "y": -50}
            }, {
                "border": [{"x": -100, "y": 0}, {"x": -50, "y": -50}, {"x": -25, "y": -25}, {
                    "x": -25,
                    "y": 25
                }, {"x": -50, "y": 50}], "center": {"x": -50, "y": 0}
            }, {
                "border": [{"x": -25, "y": -25}, {"x": 25, "y": -25}, {"x": 25, "y": 25}, {"x": -25, "y": 25}],
                "center": {"x": 0, "y": 0}
            }, {
                "border": [{"x": -50, "y": 50}, {"x": -25, "y": 25}, {"x": 25, "y": 25}, {"x": 50, "y": 50}, {
                    "x": 0,
                    "y": 100
                }], "center": {"x": 0, "y": 50}
            }, {
                "border": [{"x": 25, "y": -25}, {"x": 50, "y": -50}, {"x": 100, "y": 0}, {"x": 50, "y": 50}, {
                    "x": 25,
                    "y": 25
                }], "center": {"x": 50, "y": 0}
            }]
        )
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
            ],
        )

        console.log(is)
    });

    it("return Polygon that is fully contains inside second one", () => {
        const is = intersect(
            [
                {x: 0, y: -100},
                {x: -100, y: 0},
                {x: 0, y: 100},
                {x: 100, y: 0},
            ],
            [
                {x:0, y:-50},
                {x:-50, y:0},
                {x:0, y:50},
                {x:50, y:0},
            ],
        )

        expect(is).toHaveLength(1)
        expect(is[0]).toHaveLength(4)
        expect(is[0]).toContainEqual({x:0, y:-50})
        expect(is[0]).toContainEqual({x:-50, y:0})
        expect(is[0]).toContainEqual({x:0, y:50})
        expect(is[0]).toContainEqual({x:50, y:0})
    });
});
