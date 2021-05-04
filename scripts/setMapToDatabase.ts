// @ts-nocheck
import fs from "fs";
import * as admin from "firebase-admin";
import {ServiceAccount} from "firebase-admin/lib/credential";
// @ts-ignore
import {getVoronoiCells, morphChildrenPoints} from "../src/tools/graphics";
// @ts-ignore
import { Tree, Polygon } from "../src/types/graphics";
import serviceAccount from "./sci-map-1982-firebase-adminsdk-s5ytq-8a913139ae.json";

const ROOT_WIDTH = 1440
const ROOT_HEIGHT = 821

const ST_WIDTH = 1000;
const ST_HEIGHT = 1000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: "https://sci-map-1982.firebaseio.com",
  storageBucket: "sci-map-1982.appspot.com",
});

getMapFromFile(admin).then(function(map){
  const borders: Record<string, Polygon> = {}
  borders[0] = [{x:0, y:0}, {x:0, y:ROOT_HEIGHT}, {x:ROOT_WIDTH, y:ROOT_HEIGHT}, {x:ROOT_WIDTH, y:0}]
  const stack = map
  const dbNodes: Record<string, any> = {}
  while (stack.length > 0) {
    const node = stack.pop()
    const children = []
    const [cells, error] = getVoronoiCells(
      borders[node!.id],
      node!.children.map(ch => ({ x: ch.position.x, y: ch.position.y }))
    );
    if (error != null) {
      return error;
    }
    for (const i in node!.children) {
      node!.children[i].parentID = node!.id
      borders[node!.id] = cells[i]
    }
    stack.push(...node!.children)

    // позиция в квадрате 1000х1000
    // при отрисовке на карте позиция вычисляется под границу родителя
    // при сохранении позиция конвертируется обратно под квадрат 1000х1000
    let position = {x:0, y:0}
    if (node!.id === "0") {
      position = {x: ST_WIDTH/2, y: ST_HEIGHT/2}
    } else {
      const [newPos, err] = morphChildrenPoints(
        borders[node!.parentID],
        [{x:0, y:0}, {x:0, y:ST_HEIGHT}, {x:ST_WIDTH, y:ST_HEIGHT}, {x:ST_WIDTH, y:0}],
        {"tmp": node!.position}
      )
      position = newPos!["tmp"]
    }

    dbNodes[node!.id] = {
      parentID: node!.parentID,
      name: node!.title,
      children: node!.children.map(function(child){
        return child.id
      }),
      position: position,
    }
  }

  console.log("dbNodes", dbNodes)
})

// As an admin, the app has access to read and write all data, regardless of Security Rules
// var db = admin.database();
// var DBRef = db.ref("map");
// DBRef.set({
//   username: "a",
//   email: "v",
//   profile_picture : "dd"
// });
// DBRef.once("value", function(snapshot) {
//   console.log(snapshot.val());
// });

function getMapFromFile(admin: any): Promise<Tree[]> {
  const TMP_FILE =  __dirname + "/tmp.json"

  return admin.storage().bucket().file('map.json').download({
    destination: TMP_FILE,
  }).then(function(){
    const map = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
    return [
      {
        id: "0",
        title: "",
        position: { x: ROOT_WIDTH / 2, y: ROOT_HEIGHT / 2 },
        wikipedia: "",
        resources: [],
        children: map
      }
    ];
  });
}

