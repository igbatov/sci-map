export function splitLines(text: string, maxCharNum: number): string[] {
  if (maxCharNum <= 0) {
    return []
  }
  if (text == "") {
    return []
  }
  const words = text.split(" ");
  const lines: string[] = []
  let currLine: string[] = []
  while(words.length) {
    if (currLine.join(" ").length > maxCharNum) {
      const nextLine: string[] = []
      if (currLine.length > 1) {
        nextLine.push(currLine.pop()!)
      }
      lines.push(currLine.join(" "))
      currLine = nextLine
    } else {
      currLine.push(words.shift()!)
    }
  }

  if (currLine.join(" ").length > maxCharNum) {
    const nextLine: string[] = []
    if (currLine.length > 1) {
      nextLine.push(currLine.pop()!)
    }
    lines.push(currLine.join(" "))
    currLine = nextLine
  }
  if (currLine.length) {
    lines.push(currLine.join(" "))
  }
  return lines
}
