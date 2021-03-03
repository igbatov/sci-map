import {reactive} from "vue";
import {MapNode} from "@/types/graphics";

let bgMouseDownResolvers: Record<any, {resolve:(v: any) => void, reject:(v: any) => void, promise: Promise<any>}> = {}

const mouseDownBg = reactive({
  on: false,
  startPoint: {x:0, y:0}
})

const initLayerMouseDownResolvers = (layers: Array<Record<number, MapNode>> | undefined) => {
  bgMouseDownResolvers = {}
  for (const i in layers) {
    const promise = new Promise(function(resolve, reject) {
      bgMouseDownResolvers[i] = {resolve, reject, promise}
    });
    bgMouseDownResolvers[i].promise = promise
  }
}

const mouseDown = async (event: MouseEvent, layers: Array<Record<number, MapNode>> | undefined) => {
  const values = await Promise.allSettled<Promise<number>[]>(Object.values(bgMouseDownResolvers).map(v => v.promise))
  initLayerMouseDownResolvers(layers)
  // if one of promises was rejected - that was on node mouse down
  if (!values.reduce((prev, current) => prev * (current.status == 'fulfilled' ? 1 : 0), 1)) {
    return
  }

  mouseDownBg.on = true
  mouseDownBg.startPoint = {x:event.clientX, y:event.clientY}
}

const mouseUp = () => {
  mouseDownBg.on = false
}

const mouseMove = (emit: (name: "dragging-background" | "dragging-node" | "click-node", o: any)=>void, event: MouseEvent) => {
  if (!mouseDownBg.on) {
    return
  }
  emit('dragging-background', {
    from: mouseDownBg.startPoint,
    to: {x:event.clientX, y:event.clientY}
  })
}

const bgMouseDownReject = (layerId: number) => {
  bgMouseDownResolvers[layerId].reject(0)
}

const bgMouseDownResolve = (layerId: number) => {
  bgMouseDownResolvers[layerId].resolve(0)
}

export default {
  initLayerMouseDownResolvers,
  mouseDown,
  mouseUp,
  mouseMove,
  bgMouseDownReject,
  bgMouseDownResolve,
}
