// @ts-nocheck
import fs from "fs";
import * as admin from "firebase-admin";
import {ServiceAccount} from "firebase-admin/lib/credential";
// @ts-ignore
import {getVoronoiCells, morphChildrenPoints} from "../src/tools/graphics";
// @ts-ignore
import { Tree, Polygon, Point } from "../src/types/graphics";
// this file can be downloaded at Firebase Settings > Service Accounts: https://console.firebase.google.com/u/0/project/sci-map-1982/settings/serviceaccounts/adminsdk
// (see also https://firebase.google.com/docs/admin/setup?hl=en#prerequisites)
import serviceAccount from "./sci-map-1982-firebase-adminsdk-s5ytq-8a913139ae.json";
// @ts-ignore
import {printError} from "../src/tools/utils";
// @ts-ignore
import {DBNode} from "../src/api/types";
// @ts-ignore
import api from "../src/api/api";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: "https://sci-map-1982.firebaseio.com",
  storageBucket: "sci-map-1982.appspot.com",
});

getMapFromFile(admin).then(function(map){
  const dbNodes = convertToDBNodes(map)
  setToDB(admin, dbNodes)
})

function setToDB(admin, dbNodes: DBNode[]) {
  // As an admin, the app has access to read and write all data, regardless of Security Rules
  const db = admin.database();
  const DBRef = db.ref("map");
  DBRef.set(dbNodes);
  DBRef.get().then(function(snapshot) {
    console.log(snapshot.val());
    console.log("DONE!")
  });
}

function convertToDBNodes(map:Tree[]): DBNode[] {
  const borders: Record<string, Polygon> = {}
  borders[0] = [{x:0, y:0}, {x:0, y:api.ROOT_HEIGHT}, {x:api.ROOT_WIDTH, y:api.ROOT_HEIGHT}, {x:api.ROOT_WIDTH, y:0}]
  const stack = map
  stack[0].parentID = null
  const dbNodes: Record<string, any> = {}
  while (stack.length > 0) {
    const node = stack.pop()
    const [cells, error] = getVoronoiCells(
      borders[node!.id],
      node!.children.map(ch => ({ x: ch.position.x, y: ch.position.y }))
    );
    if (error != null) {
      printError("Cannot getVoronoiCells", {"node.id":node!.id, borders, "error":error.error, "kv":error.kv});
      return
    }
    for (const i in node!.children) {
      node!.children[i].parentID = node!.id
      borders[node!.children[i].id] = cells[i].border
    }
    stack.push(...node!.children)

    // позиция в квадрате 1000х1000
    // при отрисовке на карте позиция вычисляется под границу родителя
    // при сохранении позиция конвертируется обратно под квадрат 1000х1000
    let position = {x:0, y:0}
    if (node!.id === "0") {
      position = {x: api.ST_WIDTH/2, y: api.ST_HEIGHT/2}
    } else {
      const [newPos, err] = morphChildrenPoints(
        borders[node!.parentID],
        [{x:0, y:0}, {x:0, y:api.ST_HEIGHT}, {x:api.ST_WIDTH, y:api.ST_HEIGHT}, {x:api.ST_WIDTH, y:0}],
        {"tmp": node!.position}
      )
      position = newPos!["tmp"]
    }

    dbNodes[node!.id] = {
      id: node!.id,
      parentID: node!.parentID,
      name: node!.title,
      children: node!.children.map(function(child){
        return child.id
      }),
      position: position,
    }
  }

  return dbNodes;
}

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
        position: { x: api.ROOT_WIDTH / 2, y: api.ROOT_HEIGHT / 2 },
        wikipedia: "",
        resources: [],
        children: map
      }
    ];
  });
}

