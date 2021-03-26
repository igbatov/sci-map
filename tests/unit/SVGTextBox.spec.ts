import {splitLines} from "@/components/SVGTextBox.ts";

describe("splitLines", () => {
  it("works for lines equal maxCharNum", () => {
    const lines = splitLines("Godel incompleteness theorems", 20)
    expect(lines).toEqual([ 'Godel incompleteness', 'theorems' ])
  });

  it("works for one word", () => {
    const lines = splitLines("Godel", 3)
    expect(lines).toEqual([ 'Godel' ])
  });

  it("works even when maxCharNum < every word", () => {
    const lines = splitLines("Godel incompleteness theorems", 3)
    expect(lines).toEqual([ 'Godel', 'incompleteness', 'theorems' ])
  });

})
