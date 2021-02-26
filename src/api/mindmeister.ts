import * as map from '@/assets/map.json';
import {fillTreePositions, mindMeisterToTree, printError, skeletonToTree} from "@/tools/utils";

const skeleton = mindMeisterToTree(map.root)
const tree = skeletonToTree(skeleton!, false)
tree.id = 0
const err = fillTreePositions(
  tree,
  {width: window.innerWidth, height:window.innerHeight}
)
if (err) {
  printError("mindmeister.ts", {err})
}
export default tree
